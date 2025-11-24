const { pool, query } = require('../config/database');
const { telegramBot } = require('../config/bots');
const axios = require('axios');

/**
 * Flow Executor - Processes bot flows based on user messages
 */
class FlowExecutor {
  /**
   * Process incoming message and execute flow
   */
  async processMessage(customerId, message, channel) {
    try {
      // Check if user has active flow state
      const { data: activeState } = await supabase
        .from('bot_flow_states')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_completed', false)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (activeState) {
        // Continue existing flow
        return await this.continueFlow(activeState, message, channel);
      } else {
        // Start new flow based on trigger
        return await this.startFlow(customerId, message, channel);
      }
    } catch (error) {
      console.error('Flow execution error:', error);
      return null;
    }
  }

  /**
   * Start a new flow based on trigger
   */
  async startFlow(customerId, message, channel) {
    try {
      // Check for command trigger (/start, /help, etc.)
      let triggerType = 'keyword';
      let triggerValue = message.toLowerCase();

      if (message.startsWith('/')) {
        triggerType = 'command';
        triggerValue = message.split(' ')[0];
      }

      // Find matching flow
      const { data: flows } = await supabase
        .from('bot_flows')
        .select('*')
        .eq('is_active', true)
        .eq('trigger_type', triggerType)
        .or(`channel.eq.${channel},channel.eq.all`);

      if (!flows || flows.length === 0) {
        return null;
      }

      // Find best matching flow
      let matchedFlow = null;
      for (const flow of flows) {
        if (flow.trigger_value && message.toLowerCase().includes(flow.trigger_value.toLowerCase())) {
          matchedFlow = flow;
          break;
        }
      }

      if (!matchedFlow) {
        return null;
      }

      // Get start node
      const { data: startNode } = await supabase
        .from('bot_flow_nodes')
        .select('*')
        .eq('flow_id', matchedFlow.id)
        .eq('node_type', 'start')
        .single();

      if (!startNode) {
        return null;
      }

      // Create flow state
      const { data: flowState } = await supabase
        .from('bot_flow_states')
        .insert({
          customer_id: customerId,
          flow_id: matchedFlow.id,
          current_node_id: startNode.node_id,
          channel,
          variables: {}
        })
        .select()
        .single();

      // Execute first node
      return await this.executeNode(flowState, startNode, message);
    } catch (error) {
      console.error('Start flow error:', error);
      return null;
    }
  }

  /**
   * Continue existing flow
   */
  async continueFlow(flowState, message, channel) {
    try {
      // Get current node
      const { data: currentNode } = await supabase
        .from('bot_flow_nodes')
        .select('*')
        .eq('flow_id', flowState.flow_id)
        .eq('node_id', flowState.current_node_id)
        .single();

      if (!currentNode) {
        return null;
      }

      // Save user response to variables
      const variables = flowState.variables || {};
      if (currentNode.node_type === 'question') {
        const variableName = currentNode.config?.variable_name || 'response';
        variables[variableName] = message;
      }

      // Get next node based on user response
      const { data: nextNodes } = await supabase
        .from('bot_flow_connections')
        .select('*')
        .eq('flow_id', flowState.flow_id)
        .eq('source_node_id', currentNode.node_id);

      let nextNode = null;
      for (const connection of nextNodes || []) {
        if (this.evaluateCondition(connection, message)) {
          const { data: node } = await supabase
            .from('bot_flow_nodes')
            .select('*')
            .eq('flow_id', flowState.flow_id)
            .eq('node_id', connection.target_node_id)
            .single();
          
          nextNode = node;
          break;
        }
      }

      if (!nextNode) {
        // No next node, complete flow
        await supabase
          .from('bot_flow_states')
          .update({
            is_completed: true,
            completed_at: new Date(),
            variables
          })
          .eq('id', flowState.id);

        return null;
      }

      // Update flow state
      await supabase
        .from('bot_flow_states')
        .update({
          current_node_id: nextNode.node_id,
          variables,
          updated_at: new Date()
        })
        .eq('id', flowState.id);

      // Execute next node
      return await this.executeNode(flowState, nextNode, message);
    } catch (error) {
      console.error('Continue flow error:', error);
      return null;
    }
  }

  /**
   * Execute a node
   */
  async executeNode(flowState, node, userMessage) {
    try {
      const config = node.config || {};
      let response = null;

      switch (node.node_type) {
        case 'start':
          // Move to next node automatically
          const { data: nextConnection } = await supabase
            .from('bot_flow_connections')
            .select('target_node_id')
            .eq('flow_id', flowState.flow_id)
            .eq('source_node_id', node.node_id)
            .limit(1)
            .single();

          if (nextConnection) {
            const { data: nextNode } = await supabase
              .from('bot_flow_nodes')
              .select('*')
              .eq('flow_id', flowState.flow_id)
              .eq('node_id', nextConnection.target_node_id)
              .single();

            if (nextNode) {
              await supabase
                .from('bot_flow_states')
                .update({ current_node_id: nextNode.node_id })
                .eq('id', flowState.id);

              return await this.executeNode(flowState, nextNode, userMessage);
            }
          }
          break;

        case 'message':
          response = this.formatMessage(config, flowState.variables);
          break;

        case 'question':
          response = this.formatMessage(config, flowState.variables);
          break;

        case 'action':
          response = await this.executeAction(config, flowState);
          break;

        case 'condition':
          // Conditions are evaluated in connections
          break;

        case 'api_call':
          response = await this.executeApiCall(config, flowState.variables);
          break;

        default:
          response = { message: 'Unknown node type' };
      }

      return response;
    } catch (error) {
      console.error('Execute node error:', error);
      return null;
    }
  }

  /**
   * Format message with variables
   */
  formatMessage(config, variables) {
    let message = config.message || '';

    // Replace variables in message
    Object.keys(variables || {}).forEach(key => {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
    });

    return {
      message,
      buttons: config.buttons || [],
      image: config.image
    };
  }

  /**
   * Execute action node
   */
  async executeAction(config, flowState) {
    try {
      const action = config.action;

      switch (action) {
        case 'show_products':
          const { data: products } = await supabase
            .from('products')
            .select('*')
            .limit(config.limit || 5);

          let productList = '🛍️ *Available Products:*\n\n';
          products.forEach((product, index) => {
            productList += `${index + 1}. ${product.name}\n`;
            productList += `   Price: ${product.price} MMK\n`;
            productList += `   Stock: ${product.stock_quantity}\n\n`;
          });

          return { message: productList };

        case 'show_orders':
          const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('id', flowState.customer_id)
            .single();

          const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (!orders || orders.length === 0) {
            return { message: 'You have no orders yet.' };
          }

          let orderList = '📦 *Your Orders:*\n\n';
          orders.forEach((order, index) => {
            orderList += `${index + 1}. Order #${order.id.substring(0, 8)}\n`;
            orderList += `   Amount: ${order.total_amount} MMK\n`;
            orderList += `   Status: ${order.status}\n`;
            orderList += `   Date: ${new Date(order.created_at).toLocaleDateString()}\n\n`;
          });

          return { message: orderList };

        default:
          return { message: 'Action not implemented' };
      }
    } catch (error) {
      console.error('Execute action error:', error);
      return { message: 'Error executing action' };
    }
  }

  /**
   * Execute API call node
   */
  async executeApiCall(config, variables) {
    try {
      const { url, method, headers, body } = config;

      // Replace variables in URL and body
      let finalUrl = url;
      let finalBody = body;

      Object.keys(variables || {}).forEach(key => {
        finalUrl = finalUrl.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
        if (finalBody) {
          finalBody = JSON.parse(
            JSON.stringify(finalBody).replace(new RegExp(`{{${key}}}`, 'g'), variables[key])
          );
        }
      });

      const response = await axios({
        method: method || 'GET',
        url: finalUrl,
        headers: headers || {},
        data: finalBody
      });

      return {
        message: config.success_message || 'API call successful',
        data: response.data
      };
    } catch (error) {
      console.error('API call error:', error);
      return {
        message: config.error_message || 'API call failed'
      };
    }
  }

  /**
   * Evaluate connection condition
   */
  evaluateCondition(connection, userMessage) {
    const conditionType = connection.condition_type;
    const conditionValue = connection.condition_value;

    if (!conditionType || conditionType === 'always') {
      return true;
    }

    const message = userMessage.toLowerCase();
    const value = conditionValue ? conditionValue.toLowerCase() : '';

    switch (conditionType) {
      case 'equals':
        return message === value;
      case 'contains':
        return message.includes(value);
      case 'starts_with':
        return message.startsWith(value);
      case 'ends_with':
        return message.endsWith(value);
      default:
        return false;
    }
  }
}

module.exports = new FlowExecutor();

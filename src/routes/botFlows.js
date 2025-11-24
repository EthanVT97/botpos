const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/database');

// Get all flows
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bot_flows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single flow with nodes and connections
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get flow
    const { data: flow, error: flowError } = await supabase
      .from('bot_flows')
      .select('*')
      .eq('id', id)
      .single();

    if (flowError) throw flowError;

    // Get nodes
    const { data: nodes, error: nodesError } = await supabase
      .from('bot_flow_nodes')
      .select('*')
      .eq('flow_id', id);

    if (nodesError) throw nodesError;

    // Get connections
    const { data: connections, error: connectionsError } = await supabase
      .from('bot_flow_connections')
      .select('*')
      .eq('flow_id', id);

    if (connectionsError) throw connectionsError;

    res.json({
      success: true,
      data: {
        ...flow,
        nodes,
        connections
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new flow
router.post('/', async (req, res) => {
  try {
    const { name, description, channel, trigger_type, trigger_value } = req.body;

    const { data, error } = await supabase
      .from('bot_flows')
      .insert({
        name,
        description,
        channel: channel || 'all',
        trigger_type: trigger_type || 'keyword',
        trigger_value,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Create default start node
    await supabase
      .from('bot_flow_nodes')
      .insert({
        flow_id: data.id,
        node_id: 'start',
        node_type: 'start',
        label: 'Start',
        position_x: 100,
        position_y: 100,
        config: { message: 'Flow started' }
      });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update flow
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, channel, trigger_type, trigger_value, is_active } = req.body;

    const { data, error } = await supabase
      .from('bot_flows')
      .update({
        name,
        description,
        channel,
        trigger_type,
        trigger_value,
        is_active,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete flow
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('bot_flows')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Flow deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save flow (nodes and connections)
router.post('/:id/save', async (req, res) => {
  try {
    const { id } = req.params;
    const { nodes, connections } = req.body;

    // Delete existing nodes and connections
    await supabase.from('bot_flow_nodes').delete().eq('flow_id', id);
    await supabase.from('bot_flow_connections').delete().eq('flow_id', id);

    // Insert new nodes
    if (nodes && nodes.length > 0) {
      const nodesData = nodes.map(node => ({
        flow_id: id,
        node_id: node.id,
        node_type: node.type,
        label: node.data?.label || node.type,
        position_x: node.position?.x || 0,
        position_y: node.position?.y || 0,
        config: node.data || {}
      }));

      const { error: nodesError } = await supabase
        .from('bot_flow_nodes')
        .insert(nodesData);

      if (nodesError) throw nodesError;
    }

    // Insert new connections
    if (connections && connections.length > 0) {
      const connectionsData = connections.map(conn => ({
        flow_id: id,
        source_node_id: conn.source,
        target_node_id: conn.target,
        condition_type: conn.data?.condition_type || 'always',
        condition_value: conn.data?.condition_value,
        label: conn.label || conn.data?.label
      }));

      const { error: connectionsError } = await supabase
        .from('bot_flow_connections')
        .insert(connectionsData);

      if (connectionsError) throw connectionsError;
    }

    res.json({ success: true, message: 'Flow saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Duplicate flow
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;

    // Get original flow
    const { data: originalFlow, error: flowError } = await supabase
      .from('bot_flows')
      .select('*')
      .eq('id', id)
      .single();

    if (flowError) throw flowError;

    // Create new flow
    const { data: newFlow, error: newFlowError } = await supabase
      .from('bot_flows')
      .insert({
        name: `${originalFlow.name} (Copy)`,
        description: originalFlow.description,
        channel: originalFlow.channel,
        trigger_type: originalFlow.trigger_type,
        trigger_value: originalFlow.trigger_value ? `${originalFlow.trigger_value}_copy` : null,
        is_active: false
      })
      .select()
      .single();

    if (newFlowError) throw newFlowError;

    // Copy nodes
    const { data: nodes } = await supabase
      .from('bot_flow_nodes')
      .select('*')
      .eq('flow_id', id);

    if (nodes && nodes.length > 0) {
      const newNodes = nodes.map(node => ({
        flow_id: newFlow.id,
        node_id: node.node_id,
        node_type: node.node_type,
        label: node.label,
        position_x: node.position_x,
        position_y: node.position_y,
        config: node.config
      }));

      await supabase.from('bot_flow_nodes').insert(newNodes);
    }

    // Copy connections
    const { data: connections } = await supabase
      .from('bot_flow_connections')
      .select('*')
      .eq('flow_id', id);

    if (connections && connections.length > 0) {
      const newConnections = connections.map(conn => ({
        flow_id: newFlow.id,
        source_node_id: conn.source_node_id,
        target_node_id: conn.target_node_id,
        condition_type: conn.condition_type,
        condition_value: conn.condition_value,
        label: conn.label
      }));

      await supabase.from('bot_flow_connections').insert(newConnections);
    }

    res.json({ success: true, data: newFlow });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get flow execution stats
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('bot_flow_states')
      .select('*')
      .eq('flow_id', id);

    if (error) throw error;

    const stats = {
      total_executions: data.length,
      completed: data.filter(s => s.is_completed).length,
      in_progress: data.filter(s => !s.is_completed).length,
      completion_rate: data.length > 0 
        ? ((data.filter(s => s.is_completed).length / data.length) * 100).toFixed(2)
        : 0
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

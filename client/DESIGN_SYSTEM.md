# Myanmar POS - Modern Design System

## 🎨 Color Palette

### Primary Colors
- **Primary**: `#6366f1` (Indigo) - Main brand color
- **Primary Dark**: `#4f46e5` - Hover states
- **Primary Light**: `#818cf8` - Accents
- **Secondary**: `#ec4899` (Pink) - Secondary actions

### Semantic Colors
- **Success**: `#10b981` (Green) - Success states
- **Warning**: `#f59e0b` (Amber) - Warning states
- **Danger**: `#ef4444` (Red) - Error states
- **Info**: `#3b82f6` (Blue) - Information

### Neutral Colors
- **Dark**: `#1e293b` - Text, sidebar
- **Light**: `#f8fafc` - Backgrounds
- **Gray Scale**: 50-900 variants

## 🎭 Design Features

### Modern Aesthetics
- **Gradient Backgrounds**: Purple to pink gradient with animated overlay
- **Glass Morphism**: Frosted glass effect with backdrop blur
- **Smooth Animations**: Fade-in, slide-up, and hover effects
- **Elevated Cards**: Multi-layer shadows with hover states
- **Gradient Text**: Primary to secondary gradient on headings

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 400, 500, 600, 700, 800
- **Responsive Sizing**: Scales down on mobile devices

### Spacing System
- **Base Unit**: 4px
- **Scale**: 2, 3, 4, 6 (8px, 12px, 16px, 24px)
- **Border Radius**: sm(6px), default(8px), md(12px), lg(16px), xl(20px)

### Shadows
- **sm**: Subtle elevation
- **default**: Standard cards
- **md**: Hover states
- **lg**: Modals and overlays
- **xl**: Maximum elevation

## 📱 Responsive Breakpoints

```css
/* Desktop First Approach */
- Desktop: > 1024px (default)
- Tablet: ≤ 1024px
- Mobile: ≤ 768px
- Small Mobile: ≤ 640px
```

### Responsive Features
- **Collapsible Sidebar**: Auto-collapses on mobile
- **Mobile Menu Button**: Floating action button on mobile
- **Responsive Grids**: Auto-adjusts columns based on screen size
- **Stack Tables**: Tables stack vertically on small screens
- **Touch-Friendly**: Larger tap targets on mobile

## 🧩 Component Styles

### Buttons
- **Primary**: Gradient with shadow and hover lift
- **Secondary**: Gray with border
- **Danger**: Red gradient for destructive actions
- **Success**: Green gradient for confirmations

### Cards
- **Glass Effect**: Semi-transparent with blur
- **Hover Animation**: Lift on hover
- **Border**: Subtle white border for depth
- **Shadow**: Multi-layer for elevation

### Forms
- **Inputs**: 2px border with focus ring
- **Labels**: Bold, uppercase, small
- **Focus State**: Primary color ring
- **Hover State**: Border color change

### Tables
- **Sticky Headers**: Headers stay visible on scroll
- **Hover Rows**: Scale and highlight on hover
- **Rounded Corners**: Top and bottom radius
- **Gradient Headers**: Subtle gray gradient

### Badges
- **Gradient Background**: Color-coded with gradients
- **Border**: Matching color border
- **Uppercase**: Small, bold text
- **Shadow**: Subtle elevation

### Modals
- **Backdrop Blur**: Frosted glass overlay
- **Slide Animation**: Slides up on open
- **Rounded**: Extra large border radius
- **Elevated**: Maximum shadow

## 🎯 Utility Classes

### Layout
- `.grid`, `.grid-cols-{1-4}`, `.grid-auto-fit`
- `.flex`, `.flex-col`, `.flex-wrap`
- `.items-center`, `.justify-between`, `.justify-center`

### Spacing
- `.gap-{2,3,4,6}` - Gap between flex/grid items
- `.mb-{2,3,4,6}` - Margin bottom
- `.mt-4` - Margin top
- `.p-{4,6}` - Padding

### Typography
- `.text-{sm,lg,xl,2xl}` - Font sizes
- `.font-{bold,semibold}` - Font weights
- `.text-center` - Text alignment
- `.text-gray-{600,700}` - Text colors

### Visual
- `.rounded`, `.rounded-lg` - Border radius
- `.shadow`, `.shadow-lg` - Box shadows

### Responsive
- `.hide-mobile` - Hide on mobile devices
- `.show-mobile` - Show only on mobile
- `.flex-responsive` - Responsive flex direction
- `.table-responsive` - Scrollable tables on mobile

## 🎬 Animations

### Keyframes
- **fadeIn**: Opacity and translate Y
- **slideUp**: Modal entrance
- **spin**: Loading spinner
- **backgroundShift**: Animated background

### Transitions
- **Duration**: 150ms - 300ms
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)
- **Properties**: background, border, color, transform

## ♿ Accessibility

- **Focus Visible**: 2px primary outline
- **Color Contrast**: WCAG AA compliant
- **Touch Targets**: Minimum 44x44px on mobile
- **Keyboard Navigation**: Full support
- **Screen Reader**: Semantic HTML

## 🎨 Custom Components

### Stat Card
- Icon with gradient background
- Large value display
- Bilingual labels
- Hover animation

### Product Card
- Gradient overlay on hover
- Centered content
- Price highlight
- Stock indicator

### Search Wrapper
- Icon positioning
- Full width responsive
- Focus states

### Action Buttons
- Icon buttons
- Hover states
- Color variants

## 📦 Usage Examples

### Responsive Grid
```jsx
<div className="grid grid-auto-fit gap-4">
  {/* Cards auto-fit based on screen size */}
</div>
```

### Stat Card
```jsx
<div className="stat-card">
  <div className="stat-icon" style={{background: 'color'}}>
    <Icon />
  </div>
  <div className="stat-content">
    <div className="stat-label">Label</div>
    <div className="stat-value">Value</div>
  </div>
</div>
```

### Responsive Table
```jsx
<div className="table-responsive">
  <table className="table">
    {/* Table content */}
  </table>
</div>
```

### Button Group
```jsx
<div className="btn-group">
  <button className="btn btn-primary">Save</button>
  <button className="btn btn-secondary">Cancel</button>
</div>
```

## 🚀 Performance

- **CSS Variables**: Fast theme switching
- **Hardware Acceleration**: Transform and opacity animations
- **Lazy Loading**: Images and components
- **Optimized Fonts**: Preconnect and display swap
- **Minimal Repaints**: Transform over position changes

## 📱 Mobile Optimizations

- **Touch Gestures**: Swipe-friendly
- **Viewport Meta**: Proper scaling
- **Reduced Motion**: Respects user preferences
- **Offline Support**: Service worker ready
- **Fast Tap**: No 300ms delay

---

**Version**: 2.0  
**Last Updated**: November 2025  
**Design System**: Modern Gradient Glass Morphism

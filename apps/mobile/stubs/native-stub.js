const React = require('react')
const { View, Text } = require('react-native')

// Stub component that renders nothing or a placeholder
function StubComponent(props) {
  return props.children ? React.createElement(View, null, props.children) : null
}

// Default export (for default imports like BottomSheet, MapView)
module.exports = StubComponent
module.exports.default = StubComponent

// Named exports for destructured imports
module.exports.BottomSheetFlatList = function BottomSheetFlatList() { return null }
module.exports.BottomSheetScrollView = function BottomSheetScrollView(props) { return React.createElement(View, null, props.children) }
module.exports.BottomSheetView = function BottomSheetView(props) { return React.createElement(View, null, props.children) }
module.exports.Marker = StubComponent
module.exports.Callout = StubComponent
module.exports.PROVIDER_GOOGLE = 'google'

const React = require("react");

module.exports = {
  MapContainer: ({ children }) => React.createElement("div", null, children),
  TileLayer: () => React.createElement("div", null),
  Marker: ({ children }) => React.createElement("div", null, children),
  Popup: ({ children }) => React.createElement("div", null, children),
};

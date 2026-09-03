import InteractiveMap from '@defra/interactive-map'
import maplibreProvider from '@defra/interactive-map/providers/maplibre'
import createDatasetsPlugin from '@defra/interactive-map/plugins/datasets'
import createInteractPlugin from '@defra/interactive-map/plugins/interact'

import '@defra/interactive-map/css'

import europeanCities from './data/european-cities.geojson.json'

const CITIES_LAYER_ID = 'european-cities'
const CITY_INFO_PANEL_ID = 'city-info'

const datasetsPlugin = createDatasetsPlugin({
  datasets: [
    {
      id: CITIES_LAYER_ID,
      label: 'European cities',
      geojson: europeanCities,
      minZoom: 0,
      showInKey: true,
      showInMenu: true,
      style: {
        symbol: 'circle',
        symbolBackgroundColor: '#d61c1c',
        symbolForegroundColor: '#ffffff'
      }
    }
  ]
})

const interactPlugin = createInteractPlugin({
  interactionModes: ['selectFeature'],
  deselectOnClickOutside: true,
  layers: [
    { layerId: CITIES_LAYER_ID, idProperty: 'name', labelProperty: 'name' }
  ]
})

const interactiveMap = new InteractiveMap('map', {
  mapProvider: maplibreProvider(),
  behaviour: 'hybrid',
  mapLabel: 'Ambleside',
  zoom: 14,
  center: [-2.968, 54.425],
  containerHeight: '650px',
  enableFullscreen: true,
  plugins: [datasetsPlugin, interactPlugin],
  mapStyle: {
    url: 'https://tiles.openfreemap.org/styles/liberty',
    attribution: 'OpenFreeMap © OpenMapTiles Data from OpenStreetMap',
    backgroundColor: '#f5f5f0'
  }
})

interactiveMap.on('map:ready', () => {
  interactiveMap.fitToBounds(europeanCities)
  interactPlugin.enable()
  interactiveMap.addPanel(CITY_INFO_PANEL_ID, {
    focus: false,
    label: 'Selected city',
    html: `<div id="${CITY_INFO_PANEL_ID}-content"></div>`,
    mobile: { slot: 'drawer', dismissible: true },
    tablet: { slot: 'left-top', dismissible: true, width: '300px' },
    desktop: { slot: 'left-top', dismissible: true, width: '300px' }
  })
})

interactiveMap.on('interact:selectionchange', ({ selectedFeatures }) => {
  if (selectedFeatures.length > 0) {
    const cityName = selectedFeatures[0].properties.name
    document.getElementById(`${CITY_INFO_PANEL_ID}-content`).innerHTML =
      `<p class="govuk-body govuk-!-margin-bottom-1">${cityName}</p>`
    interactiveMap.showPanel(CITY_INFO_PANEL_ID)
  } else {
    interactiveMap.hidePanel(CITY_INFO_PANEL_ID)
  }
})

interactiveMap.on('app:panelclosed', ({ panelId }) => {
  if (panelId === CITY_INFO_PANEL_ID) {
    interactPlugin.clear()
  }
})

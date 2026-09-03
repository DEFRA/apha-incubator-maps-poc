import { vi } from 'vitest'

const mockOn = vi.fn()
const mockFitToBounds = vi.fn()
const mockAddPanel = vi.fn()
const mockShowPanel = vi.fn()
const mockHidePanel = vi.fn()
const mockInteractiveMapConstructor = vi.fn()
const mockCreateDatasetsPlugin = vi.fn(() => 'datasetsPlugin')
const mockCreateInteractPlugin = vi.fn(() => ({
  enable: vi.fn(),
  clear: vi.fn()
}))

vi.mock('@defra/interactive-map', () => ({
  default: class InteractiveMap {
    constructor(...args) {
      mockInteractiveMapConstructor(...args)
      this.on = mockOn
      this.fitToBounds = mockFitToBounds
      this.addPanel = mockAddPanel
      this.showPanel = mockShowPanel
      this.hidePanel = mockHidePanel
    }
  }
}))
vi.mock('@defra/interactive-map/providers/maplibre', () => ({
  default: vi.fn(() => 'maplibreProvider')
}))
vi.mock('@defra/interactive-map/plugins/datasets', () => ({
  default: (...args) => mockCreateDatasetsPlugin(...args)
}))
vi.mock('@defra/interactive-map/plugins/interact', () => ({
  default: (...args) => mockCreateInteractPlugin(...args)
}))
vi.mock('@defra/interactive-map/css', () => ({}))

describe('#map', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('Should construct interactive map with fullscreen enabled and the cities dataset/interact plugins', async () => {
    await import('./map.js')

    expect(mockInteractiveMapConstructor).toHaveBeenCalledWith(
      'map',
      expect.objectContaining({
        enableFullscreen: true,
        plugins: [
          'datasetsPlugin',
          expect.objectContaining({
            enable: expect.any(Function),
            clear: expect.any(Function)
          })
        ]
      })
    )
    expect(mockCreateInteractPlugin).toHaveBeenCalledWith(
      expect.objectContaining({
        interactionModes: ['selectFeature'],
        layers: [
          {
            layerId: 'european-cities',
            idProperty: 'name',
            labelProperty: 'name'
          }
        ]
      })
    )
  })

  test('Should fit bounds to the cities, enable interaction and add the city info panel when the underlying map is ready', async () => {
    await import('./map.js')

    const [, mapReadyHandler] = mockOn.mock.calls.find(
      ([eventName]) => eventName === 'map:ready'
    )
    const interactPlugin = mockCreateInteractPlugin.mock.results[0].value

    mapReadyHandler()

    expect(mockFitToBounds).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'FeatureCollection' })
    )
    expect(interactPlugin.enable).toHaveBeenCalled()
    expect(mockAddPanel).toHaveBeenCalledWith(
      'city-info',
      expect.objectContaining({ label: 'Selected city' })
    )
  })

  test('Should show the panel with the selected city name on selection change', async () => {
    await import('./map.js')

    const [, selectionChangeHandler] = mockOn.mock.calls.find(
      ([eventName]) => eventName === 'interact:selectionchange'
    )
    const cityInfoContent = { innerHTML: '' }
    vi.stubGlobal('document', { getElementById: vi.fn(() => cityInfoContent) })

    selectionChangeHandler({
      selectedFeatures: [{ properties: { name: 'Paris' } }]
    })

    expect(cityInfoContent.innerHTML).toContain('Paris')
    expect(mockShowPanel).toHaveBeenCalledWith('city-info')

    vi.unstubAllGlobals()
  })

  test('Should hide the panel when there is no selected feature', async () => {
    await import('./map.js')

    const [, selectionChangeHandler] = mockOn.mock.calls.find(
      ([eventName]) => eventName === 'interact:selectionchange'
    )

    selectionChangeHandler({ selectedFeatures: [] })

    expect(mockHidePanel).toHaveBeenCalledWith('city-info')
  })

  test('Should clear the interact plugin selection when the city info panel is closed', async () => {
    await import('./map.js')

    const [, panelClosedHandler] = mockOn.mock.calls.find(
      ([eventName]) => eventName === 'app:panelclosed'
    )
    const interactPlugin = mockCreateInteractPlugin.mock.results[0].value

    panelClosedHandler({ panelId: 'city-info' })

    expect(interactPlugin.clear).toHaveBeenCalled()
  })
})

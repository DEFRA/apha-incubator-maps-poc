/**
 * Map page controller - demonstrates the interactive map component
 */
export const mapController = {
  handler(_request, h) {
    return h.view('map/index', {
      pageTitle: 'Interactive Map',
      heading: 'Interactive Map'
    })
  }
}

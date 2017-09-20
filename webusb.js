document.addEventListener('DOMContentLoaded', event => {
  let button = document.getElementById('connect')
  let device
  button.addEventListener('click', async() => {
    const VENDOR_ID = 0x1a79
    navigator.usb.requestDevice({
      filters: [{
        vendorId: VENDOR_ID
      }]
    }).then(selectedDevice => {
      device = selectedDevice
      console.log('open')
      var tOpen = device.open()

      console.log('opened:', device)
      return tOpen
    }).then(() => {
      console.log('selectConfiguration')
      return device.selectConfiguration(1)
    }).then(() => {
      console.log('claimInterface')
      return device.claimInterface(0)
    }).then(() => {
      console.log('controlTransferOut')

      const data = new Uint8Array(64)
      data.set([0x41, 0x42, 0x43, 0x01, 0x06])

      return device.transferOut(0x01, data.buffer)
    }).then(result => {
      console.log(result)

      device.transferIn(1, 64).then(result => {
        console.log(result)
        let decoder = new TextDecoder()
        console.log('Received: ' + decoder.decode(result.data))
      }, error => {
        console.log('Error:', error)
      })
    }).catch(error => {
      console.log(error)
    })
  })
})

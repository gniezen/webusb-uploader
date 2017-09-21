document.addEventListener('DOMContentLoaded', event => {
  let button = document.getElementById('connect')
  let device
  button.addEventListener('click', async() => {
    try {
      const VENDOR_ID = 0x1A61
      device = await navigator.usb.requestDevice({
        filters: [{
          vendorId: VENDOR_ID
        }]
      })

      console.log('open')
      await device.open()
      console.log('opened:', device)

      console.log('selectConfiguration')
      await device.selectConfiguration(1)

      console.log('claimInterface')
      await device.claimInterface(0)

      console.log('transferOut')

      const data = new Uint8Array(10)
      // data.set([0x6d,0x65,0x6d])

      const result = await device.controlTransferOut({
        requestType: 'vendor',
        recipient: 'device',
        request: 0x05,
        value: 0x0000,
        index: 0x0003
      }, data)
      // await device.transferOut(0x01, data.buffer)

      console.log(result)

        /*
        device.transferIn(1, 14).then(result => {
          console.log(result)
          let decoder = new TextDecoder()
          console.log('Received: ' + decoder.decode(result.data))
        }, error => {
          console.log('Error:', error)
        })
        */
    } catch (error) {
      console.log(error)
    }
  })
})

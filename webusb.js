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

      console.log('configurations:', device.configurations)
      if (device.configuration === null) {
        console.log('selectConfiguration')
        await device.selectConfiguration(2)
      }
      console.log('configuration:', device.configuration)

      console.log('interfaces:', device.configuration.interfaces)
      console.log('claimInterface')
      await device.claimInterface(0)

      console.log('interruptTransfer')
      let result = device.transferIn(0x03, 2)
      console.log(result)

      console.log('transferOut')

      const setPortConfig = {
        requestType: 'vendor',
        recipient: 'device',
        request: 0x05,
        value: 0x00,
        index: 0x03
      }

      const openPort = {
        requestType: 'vendor',
        recipient: 'device',
        request: 0x06,
        value: 0x89,
        index: 0x03
      }

      const closePort = {
        requestType: 'vendor',
        recipient: 'device',
        request: 0x07,
        value: 0x00,
        index: 0x03
      }

      const startPort = {
        requestType: 'vendor',
        recipient: 'device',
        request: 0x08,
        value: 0x00,
        index: 0x03
      }

      const config = new Uint8Array(10)
      config.set([0x03, 0x01, 0x60, 0x00, 0x00, 0x00, 0x00, 0x11, 0x13, 0x00])
      result = await device.controlTransferOut(setPortConfig, config)
      console.log('set port config:', result)

      result = await device.controlTransferOut(openPort)
      console.log('open port:', result)

      result = await device.controlTransferOut(startPort)
      console.log('start port:', result)

      config.set([0x00, 0x08, 0x70, 0x02, 0x03, 0x00, 0x00, 0x11, 0x13, 0x00])
      result = await device.controlTransferOut(setPortConfig, config)
      console.log('set port config again:', result)

      const data = new Uint8Array(3)
      data.set([0x6d, 0x65, 0x6d])
      result = await device.transferOut(0x01, data.buffer)
      console.log('mem:', result)

      result = await device.transferIn(0x01, 256)
      let decoder = new TextDecoder() // eslint-disable-line no-undef
      console.log('Received: ' + decoder.decode(result.data))
      console.log('Raw:', buf2hex(result.data.buffer))

      if (result.status === 'stall') {
        console.warn('Endpoint stalled. Clearing.')
        await device.clearHalt('out', 1)
      }

      result = await device.controlTransferOut(closePort)
      console.log('close port:', result)

      await device.releaseInterface(0)
      await device.close()
    } catch (error) {
      console.log(error)
    }
  })
})

function buf2hex (buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join(' ')
}

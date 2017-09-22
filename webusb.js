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

      console.log('interfaces:', device.configuration.interfaces)
      console.log('claimInterface')
      await device.claimInterface(0)

      // await interruptFlush(device)

      console.log('set up port')

      await openStart(device)

      const purgePortOut = {
        requestType: 'vendor',
        recipient: 'device',
        request: 0x0B,
        value: 0x00,
        index: 0x03
      }

      const purgePortIn = {
        requestType: 'vendor',
        recipient: 'device',
        request: 0x0B,
        value: 0x80,
        index: 0x03
      }

      let result = await device.controlTransferOut(purgePortIn)
      console.log('purge port in:', result)

      await interruptFlush(device)
      await interruptFlush(device)

      result = await device.controlTransferOut(purgePortOut)
      console.log('purge port out:', result)

      await interruptFlush(device)

      console.log('clear halts')
      await device.clearHalt('out', 1)
      await device.clearHalt('in', 1)

      await openStart(device)

      const data = new Uint8Array(3)
      data.set([0x6d, 0x65, 0x6d])
      result = await device.transferOut(0x01, data.buffer)
      console.log('mem:', result)

      let incoming = await device.transferIn(0x01, 256)
      console.log('Incoming bytes:', incoming.data.byteLength)

      let decoder = new TextDecoder() // eslint-disable-line no-undef
      console.log('Received: ' + decoder.decode(incoming.data))
      console.log('Raw:', buf2hex(incoming.data.buffer))

      const closePort = {
        requestType: 'vendor',
        recipient: 'device',
        request: 0x07,
        value: 0x00,
        index: 0x03
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

async function interruptFlush (device) {
  let result = await device.transferIn(0x03, 2)
  console.log('interrupt flush:', result)
}

async function openStart (device) {
  const setPortConfig = {
    requestType: 'vendor',
    recipient: 'device',
    request: 0x05,
    value: 0x00,
    index: 0x03
  }

  const setPortOptions = {
    requestType: 'vendor',
    recipient: 'device',
    request: 0x80,
    value: 0x00,
    index: 0x05
  }

  const openPort = {
    requestType: 'vendor',
    recipient: 'device',
    request: 0x06,
    value: 0x89,
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

  // config.set([0x03, 0x01, 0x60, 0x00, 0x00, 0x00, 0x00, 0x11, 0x13, 0x00])

  config.set([
    0x00, 0x30, // baud rate (19200 : 0x0030)
    0x60, 0x00, // flags ¯\_(ツ)_/¯
    0x03,       // data bits (8 : 0x03)
    0x00,       // parity (none : 0)
    0x00,       // stop bits (none : 0)
    0x00,       // xon (false : 0)
    0x00,       // xoff (false : 0)
    0x00        // UART mode (RS-232 : 0)
  ])

  let result = await device.controlTransferOut(setPortConfig, config)
  console.log('set port config:', result)

  const options = new Uint8Array(9)
  options.set([0x30, 0x01, 0x01, 0x00, 0x00, 0xFF, 0xA4, 0x34, 0x30])
  result = await device.controlTransferOut(setPortOptions, options)
  console.log('set port options:', result)

  result = await device.controlTransferOut(openPort)
  console.log('open port:', result)

  result = await device.controlTransferOut(startPort)
  console.log('start port:', result)
}

function buf2hex (buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join(' ')
}

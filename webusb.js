document.addEventListener('DOMContentLoaded', event => {
  let button = document.getElementById('connect')

  button.addEventListener('click', async() => {
    let device
    const VENDOR_ID = 0x1A61
    const config = new Uint8Array(10)

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

    const startPort = {
      requestType: 'vendor',
      recipient: 'device',
      request: 0x08,
      value: 0x00,
      index: 0x03
    }

    const closePort = {
      requestType: 'vendor',
      recipient: 'device',
      request: 0x07,
      value: 0x00,
      index: 0x03
    }

    async function close () {
      let result = await device.controlTransferOut(closePort)
      console.log('close port:', result)
      await device.releaseInterface(0)
      await device.close()
    }

    try {
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

      console.log('set up port')

      let result = await device.controlTransferOut(openPort)
      console.log('open port:', result)

      result = await device.controlTransferOut(startPort)
      console.log('start port:', result)

      config.set([
        0x00, 0x30, // baud rate (19200 : 0x0030)
        0x60, 0x00, // flags ¯\_(ツ)_/¯
        0x03,       // data bits (8 : 0x03)
        0x00,       // parity (none : 0)
        0x00,       // stop bits (none : 0)
        0x11,       // xon (false : 0)
        0x13,       // xoff (false : 0)
        0x00        // UART mode (RS-232 : 0)
      ])
      result = await device.controlTransferOut(setPortConfig, config)
      console.log('set port config:', result)

      const data = new Uint8Array(3)
      data.set([0x6d, 0x65, 0x6d])
      result = await device.transferOut(0x01, data.buffer)
      console.log('mem:', result)

      const timeoutID = window.setTimeout(async() => {
        console.warn('Device not connected')
        await close()
      }, 5000)

      console.log('Receiving...')
      while (true) {
        let incoming = await device.transferIn(0x01, 1024)

        if (incoming.data.byteLength > 0) {
          clearTimeout(timeoutID)
          let decoder = new TextDecoder() // eslint-disable-line no-undef
          const data = decoder.decode(incoming.data)
          console.log(data)
          if (data.includes('END')) {
            break
          }
        }
      }
      await close()
    } catch (error) {
      console.log(error)
    }
  })
})

const udp = require('dgram')

const client = udp.createSocket('udp4')

const port = 3001

const hostname = 'localhost'

//receiving message from server
client.on('message', (message, info) => {
  console.log('Address: ', info.address, 'Port: ', info.port, 'Size: ', info.size)
  console.log('Message from server', message.toString())
})

const packet = Buffer.from('google.com');

//sending packet from client to server
client.send(packet, port, hostname, (err) => {
  if (err) {
    console.error('Failed to send packet !!')
  } else {
    console.log(packet)
  }
})

#peer-server#

`peer-server` makes it easy to create request/response style peer to peer applications.
It builds on top of PeerJS to make it easy for you to send and handle requests from peers.

###How to use peer-server###

    import * as PeerServer from 'peer-server'

    // peerId and options are analogous to the peerJS Peer constructor parameters
    PeerServer.startServer(peerId, options).then((peerId) => {
      console.log(peerId) // your peerId
    })

    /* sending a request */
    PeerServer.sendRequest(somePeerId, {
      'name of request': {} // whatever the value is here will be the value of req in the handler
    }, (err, data) => {
      err // will be any error from the connection and data transfer process
      data // any data that the peer sends back
    })


    /* handling requests */

    PeerServer.on('name of request', requestHandler)

    function requestHandler (req, res) {
      req // the payload data that was sent from the peer
      res({}) // will send the response data back to the other peer, can send any data
    }

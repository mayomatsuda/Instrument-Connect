import React from 'react'

export const SignIn = ({ makeRoom, joinRoom }) => {
  return (
    <div>
        <p className='title'>Instrument Connect</p>
        <button onClick={() => makeRoom()} className='homeButton'>Create Room</button><br />
        <button onClick={() => joinRoom()} className='homeButton'>Join Room</button>
    </div>
  )
}

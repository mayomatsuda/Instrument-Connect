import React, { useState } from 'react'

export const EnterRoom = ({ backButton, joinButton }) => {
    const [formValue, setFormValue] = useState('');

    const enterRoom = (e) => {
        e.preventDefault();
        joinButton(formValue);
    }

    return (
        <div>
        <form onSubmit={enterRoom}>
            <input value={formValue} placeholder='Room Code' onChange={(e) => setFormValue(e.target.value)}></input>
            <button type="submit" className='optionButton join'>Join</button>
            <button type="button" className='optionButton' onClick={() => backButton()}>Back</button>
        </form>
        </div>
    )
}

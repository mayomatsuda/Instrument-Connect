import React, { useState, useEffect, useCallback } from 'react'
import './App.css';

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

import { useMIDI, useMIDINote } from '@react-midi/hooks';

import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';

firebase.initializeApp({
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: "instrument-connect.firebaseapp.com",
  projectId: "instrument-connect",
  storageBucket: "instrument-connect.appspot.com",
  messagingSenderId: process.env.REACT_APP_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
})

const firestore = firebase.firestore();

function App() {
  const [uid, setUID] = useState('');
  // Randomly generate user ID
  useEffect(() => {
    setUID(makeid(6));
  }, [])

  const [view, setView] = useState("signIn");
  const [room, setRoom] = useState("");
  const [created, setCreated] = useState(false);

  function changeView(view) {
    setView(view);
  }

  function joinRoom(newRoom) {
    setRoom(newRoom);
    setView("home");
  }

  function makeRoom() {
    setRoom(makeid(6));
    setCreated(true);
    setView("home");
  }

  return (
    <>
      <div className="App">
        <header>

        </header>
        <section>
          {
            view === "home" ?
              <Home room={room} uid={uid} created={created} backButton={() => changeView("signIn")} /> : (view === "signIn" ?
                <SignIn joinRoom={() => changeView("enterRoom")} /> :
                <EnterRoom backButton={() => changeView("signIn")} joinButton={joinRoom} />)
          }
        </section>
      </div>
    </>
  );

  function SignIn({ joinRoom }) {
    return (
      <div>
        <p className='title'>Instrument Connect</p>
        <button onClick={() => makeRoom()} className='homeButton'>Create Room</button><br />
        <button onClick={() => joinRoom()} className='homeButton'>Join Room</button>
      </div>
    )
  }

  function EnterRoom({ backButton, joinButton }) {
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

}

function Home({ room, uid, created, backButton }) {
  const messagesRef = firestore.collection(room);
  const query = messagesRef.orderBy('createdAt').limit(25);

  const [activeNotes, setActiveNotes] = useState([]);
  const [realRoom, setRealRoom] = useState('loading');

  const [messages] = useCollectionData(query, { idField: 'id' });

  useEffect(() => {
    if (created) {
      setRealRoom('real');
      messagesRef.add({
        note: -1,
        room: room,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid,
      })
    }
  }, []);

  useEffect(() => {
    if (!created) {
      // If messages is defined, they've been loaded
      if (messages) {
        // If there are no messages, the room is not real
        if (messages.length === 0) setRealRoom('fake');
        // If there is at least one message, the room is real
        else setRealRoom('real');
      }
      // Otherwise, we're still waiting on the database
      else {
        setRealRoom('loading');
      }
    }
  }, [messages])

  // On unmount
  useEffect(() => {
    return () => {
      // If the 'host' leaves the room, delete the collection
      if (created) {
        messagesRef.get().then((q) => { q.forEach((doc) => { doc.ref.delete(); }) })
      }
    };
  }, []);

  const { inputs, outputs, hasMIDI } = useMIDI();

  const firstNote = MidiNumbers.fromNote('a1');
  const lastNote = MidiNumbers.fromNote('c8');

  const keyPressUp = useCallback(
    (key) => {
      const newArr = [...activeNotes];
      setActiveNotes(newArr.filter(x => x != key));

      // Delete from firebase upon key up
      // TO-DO: delete only if uid matches
      messagesRef.where('note', '==', key).where('uid', '==', uid).get().then((q) => { q.forEach((doc) => { doc.ref.delete(); }) })
    }
  )

  const keyPressDown = useCallback(
    (key) => {
      const newArr = [...activeNotes];
      newArr.push(key);
      setActiveNotes(newArr);

      // Add to firebase upon key down
      messagesRef.add({
        note: key,
        room: room,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid,
      })
    }
  )

  const MIDINoteLog = ({ input, keyPressDown, keyPressUp }) => {
    const event = useMIDINote(input, { channel: 1 });
    if (!event) {
      return (<></>);
    }
    const { on, note, velocity, channel } = event;
    if (on) keyPressDown(note);
    else keyPressUp(note);
    return (<></>);
  };

  return (
    <>
      {realRoom === 'real' ? <>
        <div className='piano'>
          <Piano
            noteRange={{ first: firstNote, last: lastNote }}
            playNote={(midiNumber) => {
              // Play a given note - see notes below
            }}
            stopNote={(midiNumber) => {
              // Stop playing a given note - see notes below
            }}
            activeNotes={activeNotes}
            width={1300}
          />
        </div>
        <div className='piano'>
          <Piano
            noteRange={{ first: firstNote, last: lastNote }}
            playNote={(midiNumber) => {
              // Play a given note - see notes below
            }}
            stopNote={(midiNumber) => {
              // Stop playing a given note - see notes below
            }}
            activeNotes={messages && messages.filter(x => x.uid !== uid).filter(x => x.room === room).map(x => x.note)}
            // activeNotes={messages && messages.map(x => x.note)}
            width={1300}
          />
          <MIDINoteLog input={inputs[0]} keyPressDown={keyPressDown} keyPressUp={keyPressUp} />
        </div>
        <p>
          <b>Room:</b> {room}
          <button type="button" className='optionButton' onClick={() => backButton()}>Back</button>
        </p>
      </> : (realRoom === 'loading' ? <>Loading</> : <>Room does not exist!</>)}
    </>
  )
}

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export default App;

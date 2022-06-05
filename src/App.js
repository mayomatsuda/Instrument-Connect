import React, { useState, useEffect } from 'react'
import './App.css';

import { SignIn } from './Components/SignIn';
import { EnterRoom } from './Components/EnterRoom';
import { Home } from './Components/Home';

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

firebase.initializeApp({
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: "instrument-connect.firebaseapp.com",
  projectId: "instrument-connect",
  storageBucket: "instrument-connect.appspot.com",
  messagingSenderId: process.env.REACT_APP_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
})

function App() {
  const [uid, setUID] = useState('');
  const [view, setView] = useState("signIn");
  const [room, setRoom] = useState("");
  const [created, setCreated] = useState(false);

  // Randomly generate user ID
  useEffect(() => {
    setUID(makeid(6));
  }, [])

  useEffect(() => {
    setCreated(false);
  })

  const changeView = (view) => {
    setView(view);
  }

  const joinRoom = (newRoom) => {
    setRoom(newRoom);
    setView("home");
  }

  const makeRoom = () => {
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
                <SignIn makeRoom={makeRoom} joinRoom={() => changeView("enterRoom")} /> :
                <EnterRoom backButton={() => changeView("signIn")} joinButton={joinRoom} />)
          }
        </section>
      </div>
    </>
  );

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

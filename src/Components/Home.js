import React, { useEffect, useState, useCallback } from 'react'

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { useCollectionData } from 'react-firebase-hooks/firestore';

import { useMIDI, useMIDINote } from '@react-midi/hooks';

import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';

export const Home = ({ room, uid, created, backButton }) => {
    const firestore = firebase.firestore();
    
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
    const keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: MidiNumbers.fromNote('c4'),
        lastNote: MidiNumbers.fromNote('f5'),
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
    });

    const keyPressUp = useCallback(
        (key) => {
            const newArr = [...activeNotes];
            setActiveNotes(newArr.filter(x => x != key));
        }
    )

    const keyPressDown = useCallback(
        (key) => {
            const newArr = [...activeNotes];
            newArr.push(key);
            setActiveNotes(newArr);
        }
    )

    const removeKeyFromFirebase = (key) => {
        // Delete from firebase upon key up
        // TO-DO: delete only if uid matches
        messagesRef.where('note', '==', key).where('uid', '==', uid).get().then((q) => { q.forEach((doc) => { doc.ref.delete(); }) })
    }

    const addKeyToFirebase = (key) => {
        // Add to firebase upon key down
        messagesRef.add({
            note: key,
            room: room,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            uid,
        })
    }

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
                            addKeyToFirebase(midiNumber);
                        }}
                        stopNote={(midiNumber) => {
                            // Stop playing a given note - see notes below
                            removeKeyFromFirebase(midiNumber);
                        }}
                        activeNotes={activeNotes}
                        keyboardShortcuts={keyboardShortcuts}
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
            </> : (realRoom === 'loading' ? <>Loading</> : <p>Room does not exist!<button type="button" className='optionButton' onClick={() => backButton()}>Back</button></p>)}
        </>
    )
}

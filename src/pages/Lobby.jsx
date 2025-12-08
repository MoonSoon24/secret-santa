// src/pages/Lobby.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'

export default function Lobby() {
  const { eventId } = useParams()
  const [participants, setParticipants] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchParticipants()

    // Realtime Subscription
    const channel = supabase
      .channel('room1')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'participants', filter: `event_id=eq.${eventId}` }, 
        (payload) => {
          // When someone joins, add them to list
          setParticipants(prev => [...prev, payload.new]) 
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` }, 
        (payload) => {
           // If status changes to 'LOCKED', go to Reveal page
           if(payload.new.status === 'LOCKED') navigate(`/reveal/${eventId}`)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchParticipants() {
    const { data } = await supabase.from('participants').select('*, profiles(username)').eq('event_id', eventId)
    setParticipants(data)
  }

  return (
    <div>
      <h1>Lobby Code: {eventId}</h1>
      <ul>
        {participants.map(p => <li key={p.id}>{p.profiles?.username}</li>)}
      </ul>
      {/* Only show Start button if Host */}
      <button onClick={handleStartGame}>Start Exchange</button>
    </div>
  )
}
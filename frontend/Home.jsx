import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

function Home() {
  const [auth, setAuth] = useState(false);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:8082/verify')
    .then(res => {
        if (res.data.Status === "Success") {
            setAuth(true)
            setName(res.data.name)
        } else {
            setAuth(false)
            navigate('/login')
        }
    })
    .catch(err => {
        console.log(err)
        setAuth(false)
        navigate('/login')
    });
  }, [navigate])

  return (
    <div className='container mt-4'>
        {auth && (
          <div>
            <h3>Buna, {name}!</h3>
          </div>
        )}
    </div>
  )
}

export default Home

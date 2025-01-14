import React from "react"
import {Route,Routes} from "react-router-dom"
import Home from "./routes/Home"
import Form from "./routes/Form"
import Timetable from "./routes/Timetable"
function App() {
  return (
    <>
        <Routes>
        <Route path="/" element={<Timetable/>}/>
        <Route path="/home" element={<Home/>}/>
        <Route path="/form" element={<Form/>}/>
        </Routes>
    </>
  )
}

export default App
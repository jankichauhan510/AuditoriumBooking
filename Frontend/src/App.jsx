import React from 'react'
import { ModalProvider } from "./components/ModalContext";
import Home from './home/Home'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import Layout from "./components/Layout";
// import Contact from './contact/Contact'
import About from './about/About'
import Login from './components/Login';
import Feedback from './components/Feedback'
import Auditourim from './auditourim/Auditourim'
import AuditoriumDetail from './auditourim/AuditoriumDetail';
import BookAuditorium from './auditourim/BookAuditorium';
import MainPage from './components/MainPage'
import UpdateProfile from './components/UpdateProfile';
import DashBoard from './components/DashBoard'
import ViewBookingRequest from './admin/ViewBookingRequests'
import ViewAuditoriums from './admin/ViewAuditoriums'
import ViewPaymentStatus from './admin/ViewPaymentStatus'
import ViewBookingStatus from './admin/ViewBookingStatus'
import ViewEventStatus from './admin/ViewEventStatus'
import UserBooking from './components/UserBooking'
import CreateAuditoriums from './admin/CreateAuditoriums'
// import UpdateAuditorium from './admin/UpdateAuditorium'
//import 'bootstrap/dist/css/bootstrap.min.css';
//import '../src/styles/Global.css'
import Slider from './components/Banner'
import ViewUser from './admin/ViewUser'
import AmenitiesList from './admin/AmenitiesList'

const App = () => {
  return (
    <>
      <ModalProvider>
        <div className='dark:bg-slate-900 dark:text-white'>
          <Routes>
            {/* Layout wraps Home and About */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />  {/* This renders Home on "/" */}
              <Route path="about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/feedback" element={<Feedback />} />
            </Route>
            {/* <Route path="/signup" element={<Signup />} /> */}
            {/* <Route path="/contact" element={<Contact />} /> */}
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/DashBoard/*" element={<DashBoard />} />
            <Route path="/MainPage" element={<MainPage />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/auditourim" element={<Auditourim />} />
            <Route path="/auditorium/:id" element={<AuditoriumDetail />} />
            <Route path="/book-auditorium/:id" element={<BookAuditorium />} />
            <Route path="/UpdateProfile" element={<UpdateProfile />} />
            <Route path="/ViewAuditoriums" element={<ViewAuditoriums />} />
            <Route path="/ViewBookingRequest" element={<ViewBookingRequest />} />
            <Route path="/ViewPaymentStatus" element={<ViewPaymentStatus />} />
            <Route path="/ViewBookingStatus" element={<ViewBookingStatus />} />
            <Route path="/ViewEventStatus" element={<ViewEventStatus />} />
            <Route path="/your-booking-page" element={<UserBooking />} />
            <Route path="/CreateAuditorium" element={<CreateAuditoriums />} />
            <Route path="/CreateAuditorium/:id" element={<CreateAuditoriums />} />
            <Route path="ViewUser" element={<ViewUser />} />
            <Route path="/AmenitiesList" element={<AmenitiesList />} />
            <Route path="/Slider" element={<Slider />} />
            {/* <Route path="/UpdateAuditorium/:auditoriumId" element={<UpdateAuditorium />} /> */}
          </Routes>
        </div>
      </ModalProvider>
    </>
  )
}

export default App
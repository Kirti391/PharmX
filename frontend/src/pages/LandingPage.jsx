import React from 'react'
import Navbar from '../pages/about/Navbar'
import About from '../pages/about/About'
import HowItWorks from '../pages/about/howitworks'
import Roles from '../pages/about/roles'
import  Trust from "../pages/about/Trust"
import TrustBanner from '../pages/about/verify'
import TrustCards from '../pages/about/trustcards'
import Footer from '../pages/about/footer'
const Home = () => {
  return (
  
    <div className="min-h-screen w-full">
     
      <Navbar/>
      <About/>
      <HowItWorks/>
      <Roles/>
      <Trust/>
      <TrustCards/>
      <TrustBanner/>
      <Footer/>
    </div>
  )
}

export default Home

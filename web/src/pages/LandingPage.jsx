import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

// 👇 የምስል ስላይድ ኮምፖኔንት
function ImageSlider() {
  const images = [
    "/school-building-1.jpg", 
    "/school-building-2.jpg"  
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 7000); 
    return () => clearInterval(timer);
  }, [images.length]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  return (
    <div 
      className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white group cursor-pointer bg-white"
      onClick={handleNext}
      title="ምስሉን ለመቀየር ይንኩት"
    >
      <div className="relative w-full h-[350px] md:h-[450px] lg:h-[500px] bg-slate-100">
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`School Campus ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        ))}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-20 pointer-events-none"></div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-30">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation(); 
              setCurrentIndex(idx);
            }}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage({ defaultSection }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (defaultSection === 'about' || location.pathname === '/about' || location.hash === '#about') {
      setTimeout(() => {
        const el = document.getElementById('about');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  }, [defaultSection, location.pathname, location.hash]);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-100 shadow-sm">
                <img 
                  src="/wachemo-school.jpg" 
                  alt="Wachemo School" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-lg hidden sm:block">Wachemo School</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-600 hover:text-indigo-600 font-medium">Home</a>
              <a href="#about" className="text-gray-600 hover:text-indigo-600 font-medium">About</a>
              <a href="#services" className="text-gray-600 hover:text-indigo-600 font-medium">Services</a>
              <a href="#contact" className="text-gray-600 hover:text-indigo-600 font-medium">Contact</a>
            </div>

            {/* Auth Buttons (Desktop) */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">Login</Link>
              <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition">Sign Up</Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 hover:text-indigo-600 focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu (Dropdown) */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-4 space-y-2">
            <a href="#home" className="block text-gray-600 hover:text-indigo-600 font-medium py-2">Home</a>
            <a href="#about" className="block text-gray-600 hover:text-indigo-600 font-medium py-2">About</a>
            <a href="#services" className="block text-gray-600 hover:text-indigo-600 font-medium py-2">Services</a>
            <a href="#contact" className="block text-gray-600 hover:text-indigo-600 font-medium py-2">Contact</a>
            <hr className="my-2" />
            <Link to="/login" className="block text-gray-600 hover:text-indigo-600 font-medium py-2">Login</Link>
            <Link to="/signup" className="block bg-indigo-600 text-white px-4 py-2 rounded-lg text-center font-medium mt-2">Sign Up</Link>
          </div>
        )}
      </nav>

          {/* Hero Section */}
      <section id="home" className="bg-gradient-to-br from-indigo-50 via-blue-50 to-white py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-40"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            <div className="text-center lg:text-left">
              {/* 👇 እዚህ ጋር የፊደል ዲዛይኑን ቀይሬዋለሁ */}
              <h1 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 mb-6 leading-snug lg:leading-tight">
                Modern School Management <br className="hidden md:block" />
                <span className="text-indigo-600 block mt-2">Made Simple and Responsive</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Integrated School Community Management System for Wachemo Community Excellency School. Manage students, teachers, grades, attendance, and payments all in one place.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-indigo-200 hover:-translate-y-1">
                  Get Started
                </Link>
                <a href="#about" className="bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 px-8 py-3.5 rounded-xl font-bold text-lg transition-all duration-300 hover:-translate-y-1">
                  Learn More
                </a>
              </div>
            </div>

            <div className="relative mt-12 lg:mt-0">
              <ImageSlider />
            </div>

          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-semibold tracking-wide uppercase text-sm">Our Story</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 mb-4">
              About Wachemo Community Excellency School
            </h2>
            <div className="w-24 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            <div className="relative group mt-4 lg:mt-0">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
                <img 
                  src="/wachemo-school.jpg" 
                  alt="Wachemo School Campus" 
                  className="w-full h-[350px] md:h-[450px] lg:h-[500px] object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                <div className="absolute bottom-6 left-6 text-white transform transition-transform duration-500 group-hover:translate-x-1">
                  <p className="text-sm font-medium opacity-90">Located in</p>
                  <p className="text-lg font-bold">Wachemo University Campus</p>
                </div>
              </div>

              <div className="absolute -bottom-6 right-4 md:-bottom-8 md:-right-8 bg-white p-4 md:p-6 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl md:text-3xl">
                  🎓
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-slate-900">500+</p>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Students Enrolled</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 mt-10 lg:mt-0">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 mt-1">
                  📍
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Our Location</h3>
                  <p className="text-slate-600 leading-relaxed mt-1 text-sm md:text-base">
                    Located in the Hadiya Zone, Central Ethiopia (Anbicho city area), within the Wachemo University campus—situated to the east of the university and west of the teachers' dormitory.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0 mt-1">
                  🌱
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Our History & Growth</h3>
                  <p className="text-slate-600 leading-relaxed mt-1 text-sm md:text-base">
                    Founded in 2016 E.C, the school began by providing early childhood education (KG) for the children of university faculty and staff. Over time, we have grown and expanded to include Primary education, welcoming the local community.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 mt-1">
                  🏫
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Our Operations</h3>
                  <p className="text-slate-600 leading-relaxed mt-1 text-sm md:text-base">
                    Operating on the second floor of the main university building, we currently host approximately 500 students. To manage student enrollments, daily operations, and service fees efficiently, we rely on modern digital solutions.
                  </p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-indigo-600 rounded-2xl shadow-lg text-white transition-transform duration-300 hover:scale-[1.02]">
                <h3 className="text-xl font-bold mb-2">Why the ISCMS?</h3>
                <p className="text-indigo-100 leading-relaxed text-sm md:text-base">
                  The Integrated School Community Management System (ISCMS) was developed to bring our administrative processes into the digital age—ensuring efficiency, transparency, and better communication between the school, teachers, parents, and students.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 👇 አዲሱ Services Section (ቀለማት እና ዲዛይን የተሻሻለበት) */}
      <section id="services" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -ml-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 -mr-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm bg-indigo-50 px-3 py-1 rounded-full">What We Offer</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-4 mb-4">Our Services</h2>
            <div className="w-20 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Everything you need to manage the school efficiently in one place.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ServiceCard 
              icon="📊" 
              title="For Administrators" 
              desc="Manage users, classes, and school-wide reports with a powerful dashboard." 
              color="indigo"
            />
            <ServiceCard 
              icon="👩‍🏫" 
              title="For Teachers" 
              desc="Mark attendance, enter grades, and upload resources effortlessly." 
              color="green"
            />
            <ServiceCard 
              icon="👨‍👩‍👧" 
              title="For Parents" 
              desc="Track your child's progress, receive alerts, and pay fees securely." 
              color="amber"
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-60"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-semibold tracking-wide uppercase text-sm">Get in Touch</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 mb-4">Contact Us</h2>
            <div className="w-24 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            
            <a href="https://maps.google.com/?q=Wachemo+University" target="_blank" rel="noopener noreferrer" className="group p-8 bg-slate-50 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              <div className="w-16 h-16 mx-auto bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-xl group-hover:text-indigo-600 transition-colors">Address</h3>
              <p className="text-slate-500 leading-relaxed">Hossana, Hadiya Zone<br />Ethiopia</p>
            </a>

            <a href="tel:+251910000000" className="group p-8 bg-slate-50 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              <div className="w-16 h-16 mx-auto bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-xl group-hover:text-green-600 transition-colors">Phone</h3>
              <p className="text-slate-500">+251 91 X XXXX</p>
            </a>

            <a href="mailto:info@wachemoschool.edu.et" className="group p-8 bg-slate-50 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              <div className="w-16 h-16 mx-auto bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-xl group-hover:text-amber-600 transition-colors">Email</h3>
              <p className="text-slate-500 break-all">info@wachemoschool.edu.et</p>
            </a>
            
          </div>
        </div>
      </section>

       {/* Footer */}
      <footer className="bg-slate-900 text-white pt-16 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            
            <div>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-indigo-500">Wachemo</span> School
              </h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Connecting our community with modern educational solutions. Empowering students, teachers, and parents through a transparent and efficient management system.
              </p>
              
              <div className="flex gap-4 mt-6">
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-red-600 transition text-slate-300 hover:text-white" title="YouTube">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                
                <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-sky-500 transition text-slate-300 hover:text-white" title="Telegram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-4">Services</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#services" className="hover:text-indigo-400 transition-colors">Student Management</a></li>
                <li><a href="#services" className="hover:text-indigo-400 transition-colors">Attendance Tracking</a></li>
                <li><a href="#services" className="hover:text-indigo-400 transition-colors">Grade Management</a></li>
                <li><a href="#services" className="hover:text-indigo-400 transition-colors">Fee Payments</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-4">School</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#about" className="hover:text-indigo-400 transition-colors">About Us</a></li>
                <li><a href="#about" className="hover:text-indigo-400 transition-colors">Our History</a></li>
                <li><a href="#contact" className="hover:text-indigo-400 transition-colors">Contact Support</a></li>
                <li><a href="/login" className="hover:text-indigo-400 transition-colors">Portal Login</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Student Agreement</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm text-center md:text-left">
              © {new Date().getFullYear()} Wachemo Community Excellency School. All rights reserved.
            </p>
            <p className="text-slate-500 text-sm flex items-center gap-1">
              Powered by <span className="text-indigo-400 font-semibold">Graduated Team</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({ icon, title, desc, color }) {
  const colorVariants = {
    indigo: {
      bg: "bg-white",
      border: "border-indigo-100 hover:border-indigo-300",
      shadow: "hover:shadow-indigo-100",
      iconBg: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
      text: "group-hover:text-indigo-600"
    },
    green: {
      bg: "bg-white",
      border: "border-green-100 hover:border-green-300",
      shadow: "hover:shadow-green-100",
      iconBg: "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white",
      text: "group-hover:text-green-600"
    },
    amber: {
      bg: "bg-white",
      border: "border-amber-100 hover:border-amber-300",
      shadow: "hover:shadow-amber-100",
      iconBg: "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
      text: "group-hover:text-amber-600"
    }
  };

  const style = colorVariants[color] || colorVariants.indigo;

  return (
    <div className={`group relative p-8 rounded-3xl border ${style.bg} ${style.border} shadow-sm hover:shadow-xl ${style.shadow} hover:-translate-y-2 transition-all duration-300 overflow-hidden text-center`}>
      {/* የጀርባ ማስጌጫ ክብ */}
      <div className={`absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${style.iconBg.split(' ')[0].replace('bg-', 'bg-')}`}></div>
      
      {/* የአይኮን ሳጥን */}
      <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 shadow-sm ${style.iconBg}`}>
        <span className="text-4xl">{icon}</span>
      </div>
      
      <h3 className={`text-xl font-bold text-slate-900 mb-3 transition-colors ${style.text}`}>
        {title}
      </h3>
      <p className="text-slate-500 leading-relaxed text-sm md:text-base">
        {desc}
      </p>
    </div>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Shield, Clock, Star, Users, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 relative overflow-hidden">
      {/* Premium Background Pattern */}
      <div className={"absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.03\"%3E%3Cpath d=\"M50 10 L60 25 L50 40 L40 25 Z\"/%3E%3Cpath d=\"M20 30 L30 45 L20 60 L10 45 Z\"/%3E%3Cpath d=\"M80 30 L90 45 L80 60 L70 45 Z\"/%3E%3C/g%3E%3C/svg%3E')] opacity-40"}></div>

      {/* Luxury Header */}
      <header className="relative bg-white/80 backdrop-blur-2xl shadow-2xl border-b border-white/30 sticky top-0 z-50">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-blue-50/20"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-20">
            <div className="hover:scale-105 transition-transform duration-300">
              <Logo size="lg" />
            </div>

            <div className="flex items-center space-x-6">
              <Link
                to="/login"
                className="group relative px-6 py-3 text-slate-700 hover:text-blue-600 font-semibold text-base transition-all duration-300 rounded-2xl hover:bg-white/60 backdrop-blur-sm border border-transparent hover:border-blue-200/50 hover:shadow-lg"
              >
                <span className="relative z-10">Login</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>

              <Link
                to="/signup"
                className="group relative bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-base transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Luxury Hero Section */}
      <section className="relative py-32 px-6 sm:px-8 lg:px-12 overflow-hidden">
        {/* Premium Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          {/* Premium Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/70 backdrop-blur-xl border border-white/40 rounded-full shadow-xl mb-8">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-slate-700 tracking-wide uppercase">Premium Mobility Experience</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-900 mb-8 leading-none tracking-tight">
            Your{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Luxury
              </span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-full"></div>
            </span>
            <br />
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Mobility Partner
            </span>
          </h1>

          <p className="text-2xl text-slate-600 mb-16 max-w-4xl mx-auto leading-relaxed font-medium">
            Experience{' '}
            <span className="relative">
              <span className="font-bold text-slate-800">premium transportation</span>
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            </span>
            {' '}with RideWithUs.
            <br className="hidden sm:block" />
            Safe, reliable, and always with{' '}
            <span className="font-black text-emerald-600">honest pricing</span> for every journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link
              to="/signup?type=customer"
              className="group relative bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white px-12 py-6 rounded-3xl text-xl font-black transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <MapPin className="h-6 w-6" />
                </div>
                Book Your Elite Ride
                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full animate-bounce"></div>
            </Link>

            <Link
              to="/signup?type=driver"
              className="group relative bg-gradient-to-r from-slate-800 via-slate-900 to-black hover:from-slate-900 hover:via-black hover:to-slate-800 text-white px-12 py-6 rounded-3xl text-xl font-black transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-105 overflow-hidden border border-slate-700/50"
            >
              <span className="relative z-10 flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl backdrop-blur-sm">
                  <Shield className="h-6 w-6 text-amber-400" />
                </div>
                Drive & Earn Premium
                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full animate-bounce delay-200"></div>
            </Link>
          </div>

          {/* Premium Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-black text-blue-600 mb-2">10K+</div>
              <div className="text-slate-600 font-semibold">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-purple-600 mb-2">500+</div>
              <div className="text-slate-600 font-semibold">Elite Drivers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-emerald-600 mb-2">4.9★</div>
              <div className="text-slate-600 font-semibold">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-amber-600 mb-2">24/7</div>
              <div className="text-slate-600 font-semibold">Premium Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            Why Choose RideWithUs?
          </h2>
          <p className="text-lg text-slate-600 text-center mb-16 max-w-2xl mx-auto">
            Experience the difference of honest, reliable transportation
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group text-center p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Live Tracking
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Track your driver in real-time with precise location updates and accurate arrival times.
              </p>
            </div>

            <div className="group text-center p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm border border-gray-100 hover:border-emerald-200 transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Trusted & Safe
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Every driver is thoroughly verified with background checks for your complete peace of mind.
              </p>
            </div>

            <div className="group text-center p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm border border-gray-100 hover:border-amber-200 transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Instant Booking
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Book your ride in seconds with our intuitive, streamlined booking experience.
              </p>
            </div>

            <div className="group text-center p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm border border-gray-100 hover:border-purple-200 transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Highly Rated
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Join thousands of satisfied customers who choose us for reliable transportation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">10K+</div>
              <div className="text-slate-600 font-medium">Happy Customers</div>
            </div>
            <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent mb-3">500+</div>
              <div className="text-slate-600 font-medium">Verified Drivers</div>
            </div>
            <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-3">50K+</div>
              <div className="text-slate-600 font-medium">Completed Rides</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Experience the Difference?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands who trust RideWithUs for honest, reliable transportation.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/signup?type=customer"
              className="group bg-white hover:bg-gray-100 text-slate-900 px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Start Your Journey
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              to="/signup?type=driver"
              className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Drive With Us
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Logo className="text-white" size="md" />
            </div>
            <div className="text-slate-400 font-medium">
              © 2025 RideWithUs. All rights reserved. Built with trust.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

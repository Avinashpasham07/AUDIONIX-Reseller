import React from 'react';
import { Link } from 'react-router-dom';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-black pt-12 border-t border-zinc-800 pb-32 md:pb-12 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-6">
                <div className="inline-block relative">
                    <div className="text-2xl font-black italic tracking-tighter text-red-500 leading-none">AUDIONIX</div>
                    <span className="absolute -bottom-4 right-0 text-white italic tracking-tight text-[15px] font-normal">Reseller</span>
                </div>

                <div className="flex flex-col items-center md:items-end gap-6 md:gap-4">
                    {/* Links: Order 2 on mobile (below socials), Order 1 on desktop (above socials) */}
                    <div className="flex gap-4 md:gap-6 text-zinc-400 font-medium flex-wrap justify-center order-2 md:order-1 text-sm md:text-base">
                        <Link to="/returns" className="hover:text-red-500 transition-colors">Returns Policy</Link>
                        <Link to="/terms" className="hover:text-red-500 transition-colors">Terms & Conditions</Link>
                        <Link to="/privacy" className="hover:text-red-500 transition-colors">Privacy Policy</Link>
                    </div>

                    {/* Socials: Order 1 on mobile (above links), Order 2 on desktop (below links) */}
                    <div className="flex gap-6 items-center order-1 md:order-2">
                        <a href="https://chat.whatsapp.com/EICnjNAugtsHnSYwlOeIoo" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-green-500 transition-colors">
                            <FaWhatsapp size={28} />
                        </a>
                        <a href="https://www.instagram.com/audionix.resellers?igsh=eG1jcmoyOXJjbGht" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-pink-500 transition-colors">
                            <FaInstagram size={28} />
                        </a>
                    </div>
                </div>
            </div>
            <div className="text-center text-zinc-500 text-xs md:text-sm mt-12 md:mt-8 font-medium">
                &copy; {new Date().getFullYear()} Audionix. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;

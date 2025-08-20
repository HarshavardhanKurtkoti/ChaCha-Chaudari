import React, { Fragment, useEffect, useState } from 'react'
import greetImg from '../assets/chacha-cahaudhary/chacha.webp'
import { useNavigate } from "react-router-dom";



const greetingContent = [
    {
        title: "Problem Description",
        text: `Chacha Chaudhary was declared the mascot of the Namami Gange Programme at the 37th Executive Committee meeting of the National Mission for Clean Ganga (NMCG). NMCG has tied up with Diamond Toons to develop and distribute comics, e-comics, and animated videos. The objective is to bring about behavioral change amongst children towards the Ganga and other rivers. To make this solution even more interactive, an AI, ML & chatbot-powered Interactive Robot Mascot (Chacha Chaudhary) adds value to the river people connect component of Namami Gange.`
    },
    {
        title: "Prerequisites",
        text: `The robot should independently connect with school children, the common man, and all stakeholders of NMCG for creating awareness and information dissemination. The product must be user-friendly and citizen-centric.`
    },
    {
        title: "Solution",
        text: `An interactive robot named “Chacha Chaudhary” will serve as the AI, ML, and chatbot-enabled mascot of Namami Gange. Equipped with a touch panel, it greets visitors at the entrance and guides them through each component of the Namami Gange flagship program in the River Basin War Room & Ganga Museum. The digital avatar of Chacha Chaudhary will also be available on the NMCG website. This Robot Mascot & digital avatar solution will actively engage citizens to impart information, awareness, and education around riverine ecology in an interactive format—both digitally and through outdoor installations.`
    }
];

function Greeting() {
    let navigate = useNavigate();
    useEffect(() => {
        const timer = setTimeout(() => {
            return navigate("/home");
        }, 10000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Fragment>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col items-center justify-center py-10 px-2">
                <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-4 sm:p-8 border border-blue-100 flex flex-col items-center overflow-y-auto" style={{ maxHeight: '90vh' }}>
                    <img src={greetImg} alt="Chacha Chaudhary" className="w-24 h-24 sm:w-32 sm:h-32 mb-4 rounded-full shadow-lg border-4 border-blue-200 bg-white" />
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-800 mb-4 text-center">Welcome to Namami Gange Interactive Experience</h1>
                    {greetingContent.map((section, idx) => (
                        <section className={`w-full ${idx < greetingContent.length - 1 ? 'mb-4 sm:mb-6' : ''}`} key={section.title}>
                            <h2 className="text-lg sm:text-xl font-bold text-blue-700 mb-1 sm:mb-2">{section.title}</h2>
                            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{section.text}</p>
                        </section>
                    ))}
                </div>
            </div>
        </Fragment>
    );
}
export default Greeting

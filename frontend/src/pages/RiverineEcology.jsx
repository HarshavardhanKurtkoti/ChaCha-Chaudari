
import { NavBar } from 'components';
import CarouselsReco from 'components/CarouselsReco';
import React from 'react';

function RiverineEcology() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-100 pb-10">
      <NavBar />
      <div className="max-w-5xl mx-auto px-4">
        <div className="rounded-2xl shadow-lg bg-white/90 mt-6 mb-8">
          <div className="rounded-t-2xl bg-blue-600 text-white text-center py-6 shadow-md">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight drop-shadow-lg">
              Dive into the Hidden World of Riverine Ecosystems
            </h1>
          </div>
          <div className="p-4 md:p-8">
            <div className="mb-6">
              <CarouselsReco />
            </div>
            <div className="prose max-w-none prose-headings:text-blue-700 prose-p:text-gray-700 prose-li:text-gray-700">
              <h2 className="text-2xl font-bold mb-2">Introduction</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>The Himalaya has the largest concentration of glaciers outside the polar caps with a coverage area of 33,000 km², providing 86,000,000 m³ of water through seven of Asia's great rivers - the Ganga, the Indus, the Brahmaputra, the Salween, the Mekong, the Yangtze, and the Huang-Ho.</li>
                <li>The exposed un-assorted glaciated sediments throughout the upper Himalaya evidence that the mountain is a very fragile system. It is estimated that the Himalayan mountains cover a surface area of permanent snow and ice in the region is about 97,020 km² with 12,930 km³ volume.</li>
              </ul>
              <h2 className="text-2xl font-bold mt-6 mb-2">Ganga Basin</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>The Ganga basin drains an area of 1,086,000 km² out of which 861,000 km² is in India.</li>
                <li>The catchments lie in Uttar Pradesh (294,364 km²), Madhya Pradesh (198,962 km²), undivided Bihar (143,961 km²), Rajasthan (112,490 km²), West Bengal (71,485 km²), Haryana (34,341 km²), Himachal Pradesh (4,317 km²), and Delhi (1,484 km²).</li>
                <li>The basin comprises the three main physiographic regions of the Indian subcontinent namely:
                  <ul className="list-disc pl-6">
                    <li>The young Himalayan fold mountains in the north with dense forests, as well as the sparsely forested Shiwalik Hills.</li>
                    <li>The central highland and Peninsular shield in the south consisting of mountains, hills, and plateaus intersected by valleys and river plains.</li>
                    <li>The Gangetic alluvial plain.</li>
                  </ul>
                </li>
              </ul>
              <h2 className="text-2xl font-bold mt-6 mb-2">Biodiversity</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>It is not only the biodiversity of the rivers in general and the Ganga in particular that is not adequately understood or investigated, more significantly the role of biodiversity in the functioning of river ecosystems and hence, in providing various ecosystem services is not even appreciated.</li>
                <li>The ecosystem services of a river are not confined to providing water and fish but probably the most important service lies in the assimilation of wastes from their catchments including those from anthropogenic sources. Practically all components of biodiversity contribute to this waste processing function, and thereby result in maintaining high water quality and productivity.</li>
              </ul>
              <h2 className="text-2xl font-bold mt-6 mb-2">Toxic Chemicals</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>The river receives 260 Million Liters/day industrial wastes and 1.3 billion liters/day Municipal sewage throughout its stretch.</li>
                <li>The river water is polluted with toxic chemicals and microbes. Indiscriminate use of organo-chlorine pesticides like DDT, Eldrin, Dieldrin, BHC, HCH etc both in agriculture and health sectors in Ganga Basin has led to bio-concentration and bio-magnification of these toxic chemicals in fishes and other endangered animals like the Ganges dolphins.</li>
                <li>Use of DDT in agriculture was banned in 1989 with a mandate to use a maximum of 10,000 t/yr for the control of vector-borne diseases. Most of these chemicals are carcinogenic and adversely affect human health through the food chain. More number of cancer patients has been recorded at Mahavir Cancer Hospital in Patna from the area where DDT is used to control Kala-a-zar and other various diseases (personal Communication Kishor Kunal). Moreover, chemical control is not a permanent solution for vectors like mosquitoes and sand fly as they may become immune to the toxic chemicals. Increasing the number of cancer patients in the areas where such toxic chemicals are being used is an indication of adverse effects of these toxics.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RiverineEcology;


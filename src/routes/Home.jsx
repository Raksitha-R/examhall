import React, { useEffect, useState } from 'react';
import { db } from './firebase'; // Ensure firebase is configured
import { ref, onValue, remove } from 'firebase/database';
import { useNavigate } from 'react-router-dom'; // For navigation

function Home() {
  const [staffDetails, setStaffDetails] = useState([]);
  const [venueDetails, setVenueDetails] = useState([]);
  const [dateSessionDetails, setDateSessionDetails] = useState([]);
  const navigate = useNavigate(); // To handle navigation

  useEffect(() => {
    const fetchData = (path, setState) => {
      const dataRef = ref(db, path);
      onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        const arrayData = data
          ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
          : [];
        setState(arrayData);
      });
    };

    fetchData('staff/', setStaffDetails);
    fetchData('venues/', setVenueDetails);
    fetchData('datesessions/', setDateSessionDetails);
  }, []);

  const handleDelete = (path, id) => {
    const itemRef = ref(db, `${path}/${id}`);
    remove(itemRef)
      .then(() => console.log('Item deleted successfully'))
      .catch((error) => console.error('Error deleting item:', error));
  };

  return (
    <div className="bg-purple-100 min-h-screen">
      {/* Navigation Bar */}
      <nav className="bg-purple-500 text-white py-4 px-6 shadow-md">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-sm bg-white text-purple-600 px-4 py-2 rounded hover:bg-gray-200"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-center mx-auto">Details</h1>
          <div></div> {/* Empty div to balance the layout */}
        </div>
      </nav>
  
      {/* Content Section */}
      <div className="p-6">
        {/* Flexbox Container for Staff and Venue Tables */}
        <div className="flex flex-wrap gap-4 mb-10 mt-10 justify-center shadow-md bg-purple-200 py-6 w-3/4 mx-auto">
          {/* Staff Details Table */}
          <div className="w-full md:w-1/2 bg-white shadow-md p-4 rounded">
            <h2 className="text-xl font-semibold text-violet-600 mb-4 text-center">Staff Details</h2>
            <table className="table-auto w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-violet-300 text-violet-900">
                  <th className="px-3 py-2 border">Name</th>
                  <th className="px-3 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffDetails.map((staff) => (
                  <tr key={staff.id} className="hover:bg-violet-100">
                    <td className="px-3 py-2 border text-center">{staff.name}</td>
                    <td className="px-3 py-2 border text-center">
                      <button
                        onClick={() => handleDelete('staff', staff.id)}
                        className="bg-red-400 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
  
          {/* Venue Details Table */}
          <div className="w-full md:w-1/2 bg-white shadow-md p-4 rounded">
            <h2 className="text-xl font-semibold text-violet-600 mb-4 text-center">Venue Details</h2>
            <table className="table-auto w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-violet-300 text-violet-900">
                  <th className="px-3 py-2 border">Hall (Dimensions)</th>
                  <th className="px-3 py-2 border w-1/4">Actions</th> {/* Reduced width of Actions column */}
                </tr>
              </thead>
              <tbody>
                {venueDetails.map((venue) => (
                  <tr key={venue.id} className="hover:bg-violet-100">
                    <td className="px-3 py-2 border text-center">
                      {venue.hall} ({venue.rows} x {venue.coloumns})
                    </td>
                    <td className="px-3 py-2 border text-center">
                      <button
                        onClick={() => handleDelete('venues', venue.id)}
                        className="bg-red-400 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

  
          {/* Date and Session Details Table */}
          <div className="w-full md:w-1/2 bg-white shadow-md p-4 rounded">
            <h2 className="text-xl font-semibold text-violet-600 mb-4 text-center">Date and Session Details</h2>
            <table className="w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-violet-300 text-violet-900">
                  <th className="px-3 py-2 border">Date</th>
                  <th className="px-3 py-2 border">Forenoon (FN)</th>
                  <th className="px-3 py-2 border">Afternoon (AN)</th>
                </tr>
              </thead>
              <tbody>
                {dateSessionDetails.map((session) => (
                  <tr key={session.id} className="hover:bg-violet-100">
                    <td className="px-3 py-2 border text-center">{session.date}</td>
                    <td className="px-3 py-2 border text-center">
                      {session.sessions?.FN ? 'Yes' : 'No'}
                    </td>
                    <td className="px-3 py-2 border text-center">
                      {session.sessions?.AN ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
  
}

export default Home;

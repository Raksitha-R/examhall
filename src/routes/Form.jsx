import React, { useState } from 'react';
import { db } from './firebase'; // Ensure firebase is configured
import { ref, set, remove } from 'firebase/database';

function Form() {
  const [data, setData] = useState({
    sname: '',
    hall: '',
    date: '',
    sessions: { FN: false, AN: false },
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setData((prevData) => ({
        ...prevData,
        sessions: {
          ...prevData.sessions,
          [name]: checked,
        },
      }));
    } else {
      setData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  // Handle submission of staff details
  const handleStaffSubmit = (e) => {
    e.preventDefault();
    const uid = Date.now(); // Generate unique ID based on timestamp
    set(ref(db, `staff/${uid}`), {
      name: data.sname,
    })
      .then(() => {
        console.log('Staff details added');
        setData((prevData) => ({
          ...prevData,
          sname: '', // Reset staff name field
        }));
      })
      .catch((error) => {
        console.error('Error adding staff details:', error);
      });
  };

  // Handle submission of venue details
  const handleVenueSubmit = (e) => {
    e.preventDefault();
    const uid = Date.now(); // Generate unique ID based on timestamp
    set(ref(db, `venues/${uid}`), {
      hall: data.hall,
    })
      .then(() => {
        console.log('Venue details added');
        setData((prevData) => ({
          ...prevData,
          hall: '', // Reset hall name field
        }));
      })
      .catch((error) => {
        console.error('Error adding venue details:', error);
      });
  };

  // Handle submission of date and session details
  const handleDateSubmit = (e) => {
    e.preventDefault();
    const uid = Date.now(); // Generate unique ID based on timestamp
    set(ref(db, `datesessions/${uid}`), {
      date: data.date,
      sessions: data.sessions,
    })
      .then(() => {
        console.log('Date and session details added');
        setData((prevData) => ({
          ...prevData,
          date: '', // Reset date field
          sessions: { FN: false, AN: false }, // Reset checkboxes
        }));
      })
      .catch((error) => {
        console.error('Error adding date and session details:', error);
      });
  };

  // Clear all date and session details from the database
  const handleClearDateSessions = () => {
    const datesessionsRef = ref(db, 'datesessions/');
    remove(datesessionsRef)
      .then(() => {
        console.log('All date and session details cleared');
        // Optionally reset the local state
        setData((prevData) => ({
          ...prevData,
          date: '',
          sessions: { FN: false, AN: false },
        }));
      })
      .catch((error) => {
        console.error('Error clearing date and session details:', error);
      });
  };

  return (
    <div className="bg-purple-100 min-h-screen flex flex-col items-center py-8">
      {/* <h1 className="text-2xl font-bold text-gray-800 mb-6">Exam Hall Details</h1> */}

      {/* Flex container for the forms */}
      <div className="flex flex-wrap justify-center gap-6 bg-purple-200 py-6">
        {/* Staff Details Form */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full sm:w-1/3">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Staff Details</h1>
          <form onSubmit={handleStaffSubmit} method="POST">
            <input
              type="text"
              name="sname"
              placeholder="Enter name"
              onChange={handleChange}
              value={data.sname}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-4 focus:outline-none focus:shadow-outline"
            />
            <button
              type="submit"
              className="bg-violet-500 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded"
            >
              Submit Staff
            </button>
          </form>
        </div>

        {/* Venue Details Form */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full sm:w-1/3">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Venue Details</h1>
          <form onSubmit={handleVenueSubmit} method="POST">
            <input
              type="text"
              name="hall"
              placeholder="Enter hall name"
              onChange={handleChange}
              value={data.hall}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-4 focus:outline-none focus:shadow-outline"
            />
            <button
              type="submit"
              className="bg-violet-500 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded"
            >
              Submit Venue
            </button>
          </form>
        </div>

        {/* Date and Session Details Form */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full sm:w-1/3">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Date and Session Details</h1>
          <form onSubmit={handleDateSubmit} method="POST">
            <input
              type="date"
              name="date"
              onChange={handleChange}
              value={data.date}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-4 focus:outline-none focus:shadow-outline"
            />
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="FN"
                  checked={data.sessions.FN}
                  onChange={handleChange}
                  className="form-checkbox"
                />
                <span>FN (Forenoon)</span>
              </label>
            </div>
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="AN"
                  checked={data.sessions.AN}
                  onChange={handleChange}
                  className="form-checkbox"
                />
                <span>AN (Afternoon)</span>
              </label>
            </div>
            <button
              type="submit"
              className="bg-violet-500 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded"
            >
              Submit Date and Session
            </button>
          </form>
        </div>
      </div>

      <button
        onClick={handleClearDateSessions}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-6"
      >
        Clear Date and Session
      </button>
    </div>
  );
}

export default Form;

import React, { useState } from 'react';
import { db } from './firebase'; // Ensure firebase is configured
import { ref, set, remove } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

function Form() {
  const [data, setData] = useState({
    sname: '',
    hall: '',
    rows: '',
    coloumns: '',
    date: '',
    sessions: { FN: false, AN: false },
  });

  const navigate = useNavigate();

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
    const capacity = data.rows * data.coloumns; // Calculate capacity
    set(ref(db, `venues/${uid}`), {
      hall: data.hall,
      rows: data.rows,
      coloumns: data.coloumns,
      capacity,
    })
      .then(() => {
        console.log('Venue details added');
        setData((prevData) => ({
          ...prevData,
          hall: '', // Reset hall name field
          rows: '', // Reset rows field
          coloumns: '', // Reset coloumns field
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
    <div className="bg-purple-100 min-h-screen">
      {/* Navigation Bar */}
      <nav className="bg-purple-500 text-white p-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-sm bg-white text-purple-600 px-4 py-2 rounded hover:bg-gray-200"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold mx-auto">Exam Details Form</h1>
        </div>
      </nav>

      {/* Form Container */}
      <div className="flex flex-col items-center py-8">
        <div className="flex flex-wrap justify-center gap-6 bg-purple-200 py-6">
          {/* Staff Details Form */}
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full sm:w-1/3">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Staff Details</h2>
            <form onSubmit={handleStaffSubmit}>
              <input
                type="text"
                name="sname"
                placeholder="Enter name"
                onChange={handleChange}
                value={data.sname}
                required
                className="border px-4 py-2 rounded w-full mb-4"
              />
              <button
                type="submit"
                className="bg-purple-500 text-white px-4 py-2 rounded w-full hover:bg-purple-600"
              >
                Submit Staff
              </button>
            </form>
          </div>

          {/* Venue Details Form */}
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full sm:w-1/3">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Venue Details</h2>
            <form onSubmit={handleVenueSubmit}>
              <input
                type="text"
                name="hall"
                placeholder="Enter hall name"
                onChange={handleChange}
                value={data.hall}
                required
                className="border px-4 py-2 rounded w-full mb-4"
              />
              <input
                type="number"
                name="rows"
                placeholder="Enter rows"
                onChange={handleChange}
                value={data.rows}
                required
                className="border px-4 py-2 rounded w-full mb-4"
              />
              <input
                type="number"
                name="coloumns"
                placeholder="Enter coloumns"
                onChange={handleChange}
                value={data.coloumns}
                required
                className="border px-4 py-2 rounded w-full mb-4"
              />
              <p className="text-sm text-gray-600 mb-4">
                Capacity: {data.rows && data.coloumns ? data.rows * data.coloumns : 'N/A'} students
              </p>
              <button
                type="submit"
                className="bg-purple-500 text-white px-4 py-2 rounded w-full hover:bg-purple-600"
              >
                Submit Venue
              </button>
            </form>
          </div>

          {/* Date and Session Details Form */}
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full sm:w-1/3">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Date and Session Details</h2>
            <form onSubmit={handleDateSubmit}>
              <input
                type="date"
                name="date"
                onChange={handleChange}
                value={data.date}
                required
                className="border px-4 py-2 rounded w-full mb-4"
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
                className="bg-purple-500 text-white px-4 py-2 rounded w-full hover:bg-purple-600"
              >
                Submit Date and Session
              </button>
            </form>
          </div>
        </div>

        <button
          onClick={handleClearDateSessions}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mt-6"
        >
          Clear Date and Session
        </button>
      </div>
    </div>
  );
}

export default Form;

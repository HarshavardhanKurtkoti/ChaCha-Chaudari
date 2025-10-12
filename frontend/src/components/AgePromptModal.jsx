import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const AgePromptModal = ({ isOpen, defaultName, defaultAvatar, onSave, onCancel }) => {
  const [name, setName] = useState(defaultName || '');
  const [age, setAge] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    setName(defaultName || '');
  }, [defaultName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr('');
    const ageNum = parseInt(String(age), 10);
    if (!name || Number.isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setErr('Please provide a valid name and an age between 1 and 120.');
      return;
    }
    onSave({ name, age: ageNum });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
        <div className="p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-extrabold text-blue-900 mb-4 text-center">Tell us your name and age</h3>
          <p className="text-sm text-gray-600 mb-4 text-center">We use this to tailor the experience (kid/teen/adult) and personalize chat.</p>
          {defaultAvatar && (
            <div className="flex justify-center mb-4">
              <img src={defaultAvatar} alt="Your Google profile" className="w-16 h-16 rounded-full border" loading="lazy" />
            </div>
          )}
          {err && <div className="mb-3 text-sm text-rose-600">{err}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Your age"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

AgePromptModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  defaultName: PropTypes.string,
  defaultAvatar: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default AgePromptModal;

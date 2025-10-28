import { useState } from 'react';
import Select from 'react-select';
import PropTypes from 'prop-types';

/**
 * English (India) en-IN
 *  ["India", "hi-IN"]
 */
const options = [
	{ value: 'en-IN', label: 'English' },
	{ value: 'hi-IN', label: 'Hindi' }
];

const SelectLang = ({ setLang }) => {
	const [selectedOption, setSelectedOption] = useState(options[0]);

	const customStyles = {
		control: (base, state) => ({
			...base,
			background: 'transparent',
			border: 'none',
			boxShadow: 'none',
			minHeight: '34px',
			cursor: 'pointer',
		}),
		valueContainer: (base) => ({ ...base, padding: '0 6px' }),
		singleValue: (base) => ({ ...base, color: '#e6eef8', fontWeight: 600 }),
		menu: (base) => ({
			...base,
			background: 'rgba(20,24,30,0.96)',
			color: '#e6eef8',
			borderRadius: 8,
			boxShadow: '0 10px 30px rgba(2,6,23,0.6)',
			overflow: 'hidden'
		}),
		menuList: (base) => ({ ...base, padding: 0 }),
		option: (base, { isFocused, isSelected }) => ({
			...base,
			background: isSelected ? 'rgba(139,92,246,0.9)' : (isFocused ? 'rgba(139,92,246,0.12)' : 'transparent'),
			color: isSelected ? '#fff' : '#e6eef8',
			padding: '10px 14px',
			cursor: 'pointer'
		}),
		dropdownIndicator: (base) => ({ ...base, color: '#e6eef8' }),
		indicatorSeparator: (base) => ({ ...base, background: 'transparent' }),
		placeholder: (base) => ({ ...base, color: 'rgba(255,255,255,0.38)' }),
		menuPortal: (base) => ({ ...base, zIndex: 9999 })
	};

	return (
		<div>
			<Select
				defaultValue={selectedOption}
				onChange={data => {
					setSelectedOption(data.value);
					setLang(data.value);
				}}
				menuPlacement='top'
				options={options}
				isSearchable={false}
				styles={customStyles}
				menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
				classNamePrefix='chacha-select'
			/>
		</div>
	);
};

export default SelectLang;

SelectLang.propTypes = {
	setLang: PropTypes.func.isRequired,
};

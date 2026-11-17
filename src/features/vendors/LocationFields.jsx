import { useState } from 'react';
import { SelectField, TextField } from '../../components/common/FormFields.jsx';
import { STATES, districtsOf } from '../../data/locationsData.js';

const NEW_CITY = '__new__';

/**
 * State → District → City dropdowns. Each list depends on the one before it. Cities come from
 * Firestore (`citiesOf(state, district)`); if the city isn't listed yet the user types it, and it's
 * saved for next time when the form is saved.
 *
 * `value` = { state, district, city }, `onChange(nextValue)`.
 */
export default function LocationFields({ value, onChange, citiesOf, errors = {}, required = false }) {
  const cities = citiesOf(value.state, value.district);
  const known = !value.city || cities.includes(value.city);
  const [typing, setTyping] = useState(false);
  const showInput = Boolean(value.district) && (typing || !known || cities.length === 0);

  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <>
      <SelectField
        label="State"
        required={required}
        value={value.state}
        onChange={(e) => {
          setTyping(false);
          set({ state: e.target.value, district: '', city: '' });
        }}
        options={STATES}
        placeholder="Select state"
        error={errors.state}
      />
      <SelectField
        label="District"
        required={required}
        value={value.district}
        onChange={(e) => {
          setTyping(false);
          set({ district: e.target.value, city: '' });
        }}
        options={districtsOf(value.state)}
        placeholder={value.state ? 'Select district' : 'Select a state first'}
        disabled={!value.state}
        error={errors.district}
      />
      {showInput ? (
        <TextField
          label="City"
          required={required}
          value={value.city}
          onChange={(e) => set({ city: e.target.value })}
          placeholder="Type the city name"
          error={errors.city}
          hint={
            cities.length ? (
              <button
                type="button"
                className="font-semibold text-brand-ink hover:underline"
                onClick={() => {
                  setTyping(false);
                  set({ city: '' });
                }}
              >
                Pick from saved cities instead
              </button>
            ) : (
              'New for this district — it will be offered next time.'
            )
          }
        />
      ) : (
        <SelectField
          label="City"
          required={required}
          value={value.city}
          onChange={(e) => {
            if (e.target.value === NEW_CITY) {
              setTyping(true);
              set({ city: '' });
            } else set({ city: e.target.value });
          }}
          options={[...cities, { value: NEW_CITY, label: '+ Add a new city' }]}
          placeholder={value.district ? 'Select city' : 'Select a district first'}
          disabled={!value.district}
          error={errors.city}
        />
      )}
    </>
  );
}

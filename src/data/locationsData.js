/**
 * Indian states and union territories with their main cities, for State → City dropdowns.
 * City spellings match the ones used elsewhere in the app (e.g. "Bangalore", "Kochi").
 */
export const STATE_CITIES = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kakinada', 'Anantapur'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang'],
  Assam: ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Tezpur', 'Tinsukia'],
  Bihar: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia'],
  Chhattisgarh: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
  Goa: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', 'Jamnagar', 'Vapi', 'Anand', 'Mundra'],
  Haryana: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Sonipat', 'Manesar'],
  'Himachal Pradesh': ['Shimla', 'Baddi', 'Solan', 'Dharamshala', 'Mandi'],
  Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
  Karnataka: ['Bangalore', 'Mysore', 'Mangalore', 'Hubli', 'Belgaum', 'Tumkur', 'Davanagere', 'Shimoga', 'Udupi'],
  Kerala: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Palakkad', 'Alappuzha', 'Kottayam', 'Malappuram'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Pithampur'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Navi Mumbai', 'Aurangabad', 'Kolhapur', 'Solapur'],
  Manipur: ['Imphal', 'Thoubal'],
  Meghalaya: ['Shillong', 'Tura'],
  Mizoram: ['Aizawl', 'Lunglei'],
  Nagaland: ['Kohima', 'Dimapur'],
  Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur', 'Berhampur', 'Paradip'],
  Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Mohali', 'Bathinda'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Bhiwadi', 'Alwar'],
  Sikkim: ['Gangtok', 'Namchi'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Hosur', 'Erode', 'Vellore', 'Tirunelveli', 'Thoothukudi'],
  Telangana: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Secunderabad'],
  Tripura: ['Agartala', 'Udaipur'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Greater Noida', 'Ghaziabad', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut'],
  Uttarakhand: ['Dehradun', 'Haridwar', 'Rudrapur', 'Roorkee', 'Haldwani'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol', 'Haldia'],
  'Andaman & Nicobar Islands': ['Port Blair'],
  Chandigarh: ['Chandigarh'],
  'Dadra & Nagar Haveli and Daman & Diu': ['Silvassa', 'Daman', 'Diu'],
  Delhi: ['New Delhi', 'Delhi'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag'],
  Ladakh: ['Leh', 'Kargil'],
  Lakshadweep: ['Kavaratti'],
  Puducherry: ['Puducherry', 'Karaikal'],
};

export const STATES = Object.keys(STATE_CITIES);

export const citiesOf = (state) => STATE_CITIES[state] ?? [];

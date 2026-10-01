const { put } = require('@vercel/blob');

const allowedOptions = {
  poojaSelect: [
    'Sri Maha Ganapathi Homam',
    'Gruhapravesam & Vastu Homam',
    'Navagraha Shanti Homam',
    'Sri Ayushya Homam',
    'Sri Satyanarayana Swamy Vratham',
    'Sashtiapthapoorthi (60th) Seva',
    'Sudarshana Homam',
    'Dhanvantri Homam',
    'Other Custom Pooja',
  ],
  muhurthamTime: [
    'Brahma Muhurtham (4:30 AM - 6:00 AM)',
    'Morning Auspicious Hora (7:30 AM - 10:30 AM)',
    'Evening Pradosham / Sayaratchai (4:30 PM - 7:30 PM)',
    'Need Acharya to suggest best Muhurtham based on Nakshatra',
  ],
  citySelect: ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Tirunelveli', 'Vellore', 'Bangalore-Hosur', 'Other'],
};

function respond(res, status, value) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(value);
}

module.exports = async function bookings(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return respond(res, 405, { error: 'Method not allowed.' });
  }
  if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) {
    return respond(res, 403, { error: 'Please submit from this website.' });
  }
  if (!req.headers['content-type']?.startsWith('application/json')) {
    return respond(res, 415, { error: 'Please submit a valid booking form.' });
  }

  const input = req.body;
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return respond(res, 400, { error: 'Please complete the booking form.' });
  }

  const fields = ['fullName', 'phone', 'poojaSelect', 'muhurthamTime', 'ceremonyDate', 'citySelect', 'notes'];
  const details = Object.fromEntries(fields.map((field) => [field, typeof input[field] === 'string' ? input[field].trim() : '']));
  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const parsedDate = new Date(`${details.ceremonyDate}T00:00:00Z`);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(details.ceremonyDate)
    && !Number.isNaN(parsedDate.getTime())
    && parsedDate.toISOString().slice(0, 10) === details.ceremonyDate
    && details.ceremonyDate >= localDate;

  if (details.fullName.length < 2 || details.fullName.length > 100
    || !/^[6-9]\d{9}$/.test(details.phone)
    || !validDate
    || details.notes.length > 2000
    || Object.entries(allowedOptions).some(([field, options]) => !options.includes(details[field]))) {
    return respond(res, 422, { error: 'Please check your name, mobile number, ceremony, and future date, then try again.' });
  }

  const id = req.headers['idempotency-key'];
  if (typeof id !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) {
    return respond(res, 400, { error: 'Please reload the page and try again.' });
  }

  const record = {
    reference: `VP-${id.slice(0, 8).toUpperCase()}`,
    id,
    createdAt: new Date().toISOString(),
    status: 'pending',
    details,
  };

  try {
    await put(`bookings/${id}.json`, JSON.stringify(record, null, 2), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return respond(res, 201, { reference: record.reference, status: record.status });
  } catch (error) {
    console.error('Booking save failed:', error.name || 'Error');
    return respond(res, 500, { error: 'Your request could not be saved. Please try again.' });
  }
};

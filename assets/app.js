const STORAGE_KEY = 'booking-app-data';
const DEFAULT_DATA = {
  services: [
    { id: crypto.randomUUID(), name: 'Consulta inicial', duration: 45, price: 0 },
    { id: crypto.randomUUID(), name: 'Sesión de seguimiento', duration: 60, price: 50 },
    { id: crypto.randomUUID(), name: 'Tratamiento premium', duration: 90, price: 90 }
  ],
  professionals: [],
  slots: [],
  bookings: []
};

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(DEFAULT_DATA);
  try {
    const parsed = JSON.parse(saved);
    return { ...structuredClone(DEFAULT_DATA), ...parsed };
  } catch (e) {
    console.error('Error leyendo datos, se restauran valores por defecto', e);
    return structuredClone(DEFAULT_DATA);
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatCurrency(value) {
  if (!value) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
}

function renderServices(data) {
  const serviceList = document.getElementById('service-list');
  const serviceSelect = document.getElementById('service-select');
  if (serviceList) {
    serviceList.innerHTML = '';
    data.services.forEach((service) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${service.name}</strong>
        <span class="meta">Duración: ${service.duration} min · Precio: ${formatCurrency(service.price)}</span>
      `;
      serviceList.appendChild(li);
    });
  }
  if (serviceSelect) {
    serviceSelect.innerHTML = '';
    data.services.forEach((service) => {
      const option = document.createElement('option');
      option.value = service.id;
      option.textContent = service.name;
      serviceSelect.appendChild(option);
    });
  }
}

function renderProfessionalPills(data) {
  const container = document.getElementById('professional-services');
  if (!container) return;
  container.innerHTML = '';
  data.services.forEach((service) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'pill';
    pill.textContent = service.name;
    pill.dataset.id = service.id;
    pill.dataset.selected = 'false';
    pill.addEventListener('click', () => {
      pill.dataset.selected = pill.dataset.selected === 'true' ? 'false' : 'true';
    });
    container.appendChild(pill);
  });
}

function renderProfessionals(data) {
  const professionalList = document.getElementById('professional-list');
  const professionalSelect = document.getElementById('professional-select');
  const slotProfessional = document.getElementById('slot-professional');

  if (professionalList) {
    professionalList.innerHTML = '';
    data.professionals.forEach((prof) => {
      const services = data.services
        .filter((service) => prof.services.includes(service.id))
        .map((service) => service.name)
        .join(', ');
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${prof.name}</strong>
        <span class="meta">Servicios: ${services || 'No asignado'}</span>
      `;
      professionalList.appendChild(li);
    });
  }

  [professionalSelect, slotProfessional].forEach((select) => {
    if (!select) return;
    select.innerHTML = '';
    data.professionals.forEach((prof) => {
      const option = document.createElement('option');
      option.value = prof.id;
      option.textContent = prof.name;
      select.appendChild(option);
    });
  });
}

function renderSlots(data) {
  const slotList = document.getElementById('slot-list');
  if (!slotList) return;

  slotList.innerHTML = '';
  data.slots
    .sort((a, b) => a.day.localeCompare(b.day))
    .forEach((slot) => {
      const professional = data.professionals.find((p) => p.id === slot.professionalId);
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${slot.day}</strong>
        <span class="meta">${professional?.name || 'Sin asignar'} · ${slot.times.join(', ')}</span>
      `;
      slotList.appendChild(li);
    });
}

function getAvailableDays(data, professionalId) {
  return data.slots.filter((slot) => slot.professionalId === professionalId).map((slot) => slot.day);
}

function renderDays(data) {
  const daySelect = document.getElementById('day-select');
  const professionalSelect = document.getElementById('professional-select');
  if (!daySelect || !professionalSelect) return;
  const professionalId = professionalSelect.value;
  const days = getAvailableDays(data, professionalId);
  daySelect.innerHTML = '';
  days.forEach((day) => {
    const option = document.createElement('option');
    option.value = day;
    option.textContent = new Intl.DateTimeFormat('es-ES', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(day));
    daySelect.appendChild(option);
  });
}

function renderTimes(data) {
  const timeSelect = document.getElementById('time-select');
  const daySelect = document.getElementById('day-select');
  const professionalSelect = document.getElementById('professional-select');
  if (!timeSelect || !daySelect || !professionalSelect) return;

  const selectedDay = daySelect.value;
  const professionalId = professionalSelect.value;
  const slot = data.slots.find((s) => s.professionalId === professionalId && s.day === selectedDay);
  const bookedTimes = data.bookings
    .filter((booking) => booking.professionalId === professionalId && booking.day === selectedDay)
    .map((booking) => booking.time);

  timeSelect.innerHTML = '';
  (slot?.times || []).forEach((time) => {
    if (bookedTimes.includes(time)) return;
    const option = document.createElement('option');
    option.value = time;
    option.textContent = time;
    timeSelect.appendChild(option);
  });

  if (!timeSelect.value) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Sin horarios disponibles';
    timeSelect.appendChild(option);
  }
}

function renderBookings(data) {
  const bookingList = document.getElementById('booking-list');
  if (!bookingList) return;
  bookingList.innerHTML = '';
  data.bookings
    .sort((a, b) => `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`))
    .forEach((booking) => {
      const service = data.services.find((s) => s.id === booking.serviceId);
      const professional = data.professionals.find((p) => p.id === booking.professionalId);
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${booking.client}</strong>
        <span class="meta">${service?.name || 'Servicio'} · ${professional?.name || 'Profesional'}</span>
        <span class="meta">${booking.day} a las ${booking.time}</span>
        ${booking.notes ? `<span class="meta">Notas: ${booking.notes}</span>` : ''}
      `;
      bookingList.appendChild(li);
    });
}

function handleServiceSubmit(data) {
  const form = document.getElementById('service-form');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const service = {
      id: crypto.randomUUID(),
      name: formData.get('name'),
      duration: Number(formData.get('duration')),
      price: Number(formData.get('price'))
    };
    data.services.push(service);
    saveData(data);
    renderServices(data);
    renderProfessionalPills(data);
    form.reset();
  });
}

function handleProfessionalSubmit(data) {
  const form = document.getElementById('professional-form');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const selectedServices = Array.from(
      document.querySelectorAll('#professional-services .pill[data-selected="true"]')
    ).map((pill) => pill.dataset.id);
    const professional = {
      id: crypto.randomUUID(),
      name: formData.get('name'),
      services: selectedServices
    };
    data.professionals.push(professional);
    saveData(data);
    renderProfessionals(data);
    renderDays(data);
    renderTimes(data);
    form.reset();
    renderProfessionalPills(data);
  });
}

function handleSlotSubmit(data) {
  const form = document.getElementById('slot-form');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const professionalId = formData.get('professional');
    const day = formData.get('day');
    const times = formData
      .get('times')
      .split(',')
      .map((time) => time.trim())
      .filter(Boolean);
    const existingIndex = data.slots.findIndex(
      (slot) => slot.professionalId === professionalId && slot.day === day
    );
    const slot = { professionalId, day, times };
    if (existingIndex >= 0) {
      data.slots[existingIndex] = slot;
    } else {
      data.slots.push(slot);
    }
    saveData(data);
    renderSlots(data);
    renderDays(data);
    renderTimes(data);
    form.reset();
  });
}

function handleBookingSubmit(data) {
  const form = document.getElementById('booking-form');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const booking = {
      id: crypto.randomUUID(),
      client: formData.get('client'),
      serviceId: formData.get('service'),
      professionalId: formData.get('professional'),
      day: formData.get('day'),
      time: formData.get('time'),
      notes: formData.get('notes')
    };
    if (!booking.time) return;
    data.bookings.push(booking);
    saveData(data);
    renderBookings(data);
    renderTimes(data);
    form.reset();
    renderDays(data);
  });
}

function handleDependentSelects(data) {
  const professionalSelect = document.getElementById('professional-select');
  const daySelect = document.getElementById('day-select');
  if (professionalSelect) {
    professionalSelect.addEventListener('change', () => {
      renderDays(data);
      renderTimes(data);
    });
  }
  if (daySelect) {
    daySelect.addEventListener('change', () => {
      renderTimes(data);
    });
  }
}

function ensureDefaultProfessional(data) {
  if (data.professionals.length || !data.services.length) return;
  data.professionals.push({
    id: crypto.randomUUID(),
    name: 'Equipo general',
    services: data.services.map((service) => service.id)
  });
}

function ensureDefaultSlots(data) {
  if (data.slots.length || !data.professionals.length) return;
  const today = new Date();
  const days = [1, 3, 5].map((offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    return date.toISOString().slice(0, 10);
  });
  days.forEach((day) => {
    data.slots.push({ professionalId: data.professionals[0].id, day, times: ['10:00', '12:00', '16:00'] });
  });
}

function init() {
  const data = loadData();
  ensureDefaultProfessional(data);
  ensureDefaultSlots(data);
  saveData(data);

  renderServices(data);
  renderProfessionalPills(data);
  renderProfessionals(data);
  renderSlots(data);
  renderDays(data);
  renderTimes(data);
  renderBookings(data);

  handleServiceSubmit(data);
  handleProfessionalSubmit(data);
  handleSlotSubmit(data);
  handleBookingSubmit(data);
  handleDependentSelects(data);
}

document.addEventListener('DOMContentLoaded', init);

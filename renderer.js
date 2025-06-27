const { ipcRenderer } = require('electron');
const axios = require('axios');
const SimpleKeyboard = window.SimpleKeyboard || window.default || window;

let selectedFrame = null;

let keyboard = null;
let focusedInput = null;

function showKeyboard(input) {
    focusedInput = input;

    if (!keyboard && window.Keyboard) {
        keyboard = new SimpleKeyboard.default({
            onChange: input => {
                if (focusedInput) focusedInput.value = input;
            },
            onKeyPress: button => {
                if (button === "{enter}" && focusedInput) {
                    focusedInput.blur();
                    hideKeyboard();
                }
            }
        });
    }

    if (keyboard) {
        keyboard.setInput(input.value);
        document.getElementById("keyboard").style.display = "block";
    } else {
        console.warn("Keyboard class is not defined.");
    }
}

function hideKeyboard() {
    document.getElementById("keyboard").style.display = "none";
    focusedInput = null;
}

// Event listeners tetap di dalam window.onload
window.onload = async () => {
    const frameList = document.getElementById('frames');
    try {
        const res = await axios.get('http://localhost:8000/api/frames');
        res.data.forEach(frame => {
            const el = document.createElement('div');
            el.className = 'bg-white rounded-xl p-5 shadow-md w-72 text-center cursor-pointer transition-transform hover:scale-105';
            el.innerHTML = `
                <img src="http://localhost:8000/storage/${frame.image}" alt="${frame.name}" class="mx-auto max-h-80 object-contain rounded mb-3" />
                <div class="font-semibold text-lg">${frame.name}</div>
                <div class="text-gray-500 text-sm">Rp ${Number(frame.price).toLocaleString('id-ID')}</div>
            `;
            el.onclick = () => selectFrame(frame);
            frameList.appendChild(el);
        });
    } catch (error) {
        console.error('Gagal memuat frame:', error);
    }

    // Attach ke semua input
    ["nama", "email", "nohp"].forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener("focus", () => showKeyboard(input));
    });
};


function selectFrame(frame) {
    selectedFrame = frame;
    document.getElementById('order-modal').style.display = 'flex';
}
// tombol tutup modal
document.getElementById('close-modal').onclick = () => {
    document.getElementById('order-modal').style.display = 'none';
};

// submit pembayaran
document.getElementById('submit-payment').onclick = async () => {
    const nama = document.getElementById('nama').value.trim();
    const email = document.getElementById('email').value.trim();
    const nohp = document.getElementById('nohp').value.trim();

    if (!nama || !email || !nohp) {
        alert('Mohon lengkapi semua data.');
        return;
    }

    try {
        // Simpan ke database (clients + orders)
        const orderRes = await axios.post('http://localhost:8000/api/orders', {
            name: nama,
            email: email,
            phone: nohp,
            frame_id: selectedFrame.id,
            amount: selectedFrame.price
        });

        const order = orderRes.data;

        // Ambil token Midtrans berdasarkan order ID
        const tokenRes = await axios.post('http://localhost:8000/api/payment-token', {
            order_id: order.id,
            amount: selectedFrame.price,
            name: nama,
            email: email
        });

        const snapToken = tokenRes.data.token;

        document.getElementById('order-modal').classList.add('hidden');
        document.getElementById('order-modal').classList.remove('flex');

        window.snap.pay(snapToken, {
            onSuccess: () => {
                const slot = selectedFrame.total_slot || 4;
                window.location.href = `camera.html?order_id=${order.id}&frame_id=${selectedFrame.id}&count=${slot}`;
            },
            onError: () => {
                alert('Pembayaran gagal.');
            }
        });
    } catch (err) {
        console.error('Error:', err);
        alert('Terjadi kesalahan saat memproses pembayaran.');
    }
};

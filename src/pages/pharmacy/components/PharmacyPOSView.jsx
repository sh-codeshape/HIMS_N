import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import Button from "../../../components/common/Button.jsx";
import { mockStore } from "../../../mock/mockStore";
import "./PharmacyPOSView.css";

export default function PharmacyPOSView() {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [doctorName, setDoctorName] = useState("Dr. Rajesh Sharma");

  useEffect(() => {
    setMedicines(mockStore.getMedicines());
  }, []);

  const filteredMedicines = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.generic.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToCart = (med) => {
    if (med.stock <= 0) {
      toast.error("Item out of stock!");
      return;
    }
    const existing = cart.find((i) => i.id === med.id);
    if (existing) {
      if (existing.qty >= med.stock) {
        toast.error("Cannot exceed available warehouse stock.");
        return;
      }
      setCart(cart.map((i) => (i.id === med.id ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setCart([...cart, { ...med, qty: 1 }]);
    }
  };

  const handleUpdateQty = (id, delta) => {
    setCart(
      cart
        .map((i) => {
          if (i.id === id) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const cartTotal = cart.reduce((acc, curr) => acc + curr.qty * curr.unitPrice, 0);

  const handleCheckout = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Pharmacy cart is empty!");
      return;
    }

    cart.forEach((item) => {
      mockStore.dispenseMedicine(item.id, item.qty);
    });

    setMedicines(mockStore.getMedicines());
    toast.success(`Medicine Dispensed! Invoice Amount: ₹${cartTotal.toFixed(2)}`, {
      icon: "💊",
    });
    setCart([]);
    setCustomerName("");
  };

  return (
    <div className="pharma-pos-grid">
      {/* Drug Catalog Search */}
      <div className="pharma-pos-card">
        <div className="pharma-header">
          <div>
            <h3 className="pharma-title">Drug Inventory Catalog</h3>
            <p className="pharma-sub">Select medicines to add to dispensing cart</p>
          </div>
          <div className="pharma-search">
            <Icon name="LuSearch" size={16} />
            <input
              type="text"
              placeholder="Search brand / generic name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="pharma-list">
          {filteredMedicines.map((med) => (
            <div key={med.id} className="pharma-item">
              <div className="pharma-info">
                <span className="pharma-name">{med.name}</span>
                <span className="pharma-gen">{med.generic} • Batch: {med.batch}</span>
                <div className="pharma-meta">
                  <span className="pharma-exp">Exp: {med.expiry}</span>
                  <span
                    className={`pharma-stock-tag ${
                      med.stock < 100 ? "pharma-stock--low" : "pharma-stock--ok"
                    }`}
                  >
                    Stock: {med.stock} units
                  </span>
                </div>
              </div>

              <div className="pharma-action">
                <div className="pharma-price">₹{med.unitPrice}</div>
                <button
                  type="button"
                  className="pharma-add-btn"
                  onClick={() => handleAddToCart(med)}
                  disabled={med.stock <= 0}
                >
                  + Add to Bill
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* POS Cart & Checkout */}
      <div className="pharma-pos-card">
        <div className="pharma-header">
          <div>
            <h3 className="pharma-title">Dispense Prescription</h3>
            <p className="pharma-sub">Active billing tray</p>
          </div>
          <span className="pharma-count">{cart.length} Items</span>
        </div>

        <form onSubmit={handleCheckout}>
          <div className="pharma-form-row">
            <input
              type="text"
              className="pharma-input"
              placeholder="Patient Name / Walk-in"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <input
              type="text"
              className="pharma-input"
              placeholder="Prescribing Doctor"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>

          <div className="pharma-cart-items">
            {cart.length === 0 ? (
              <div className="pharma-empty">
                <Icon name="LuPill" size={32} />
                <p>Cart is empty. Click + Add on any medicine to dispense.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pharma-cart-row">
                  <div className="pharma-cart-info">
                    <span className="pharma-cart-iname">{item.name}</span>
                    <span className="pharma-cart-iprice">₹{item.unitPrice} × {item.qty}</span>
                  </div>
                  <div className="pharma-qty-controls">
                    <button
                      type="button"
                      className="pharma-qty-btn"
                      onClick={() => handleUpdateQty(item.id, -1)}
                    >
                      -
                    </button>
                    <span className="pharma-qty-num">{item.qty}</span>
                    <button
                      type="button"
                      className="pharma-qty-btn"
                      onClick={() => handleUpdateQty(item.id, 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="pharma-row-total">
                    ₹{(item.qty * item.unitPrice).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pharma-total-box">
            <div className="pharma-total-row">
              <span>Subtotal:</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="pharma-total-row">
              <span>GST (Incl 5%):</span>
              <span>₹{(cartTotal * 0.05).toFixed(2)}</span>
            </div>
            <div className="pharma-grand-total">
              <span>Net Amount:</span>
              <span>₹{(cartTotal * 1.05).toFixed(2)}</span>
            </div>
          </div>

          <Button type="submit" fullWidth disabled={cart.length === 0}>
            <Icon name="LuCheckCircle" size={16} /> Complete Dispense & Print Slip
          </Button>
        </form>
      </div>
    </div>
  );
}

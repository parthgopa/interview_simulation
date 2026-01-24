import { useState, useEffect } from "react";
import Section from "../../ui/Section";
import Card from "../../ui/Card";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import "./AdminPricing.css";
import { HiPencil, HiTrash, HiPlus } from "react-icons/hi2";
import { backendURL } from "../../pages/Home";

export default function PricingManager() {
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", description: "", features: "", variant: "primary", isPopular: false });

  const fetchPlans = () => {
    fetch(`${backendURL}/pricing-api/pricing`).then(res => res.json()).then(setPlans);
  };

  useEffect(() => fetchPlans(), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, features: typeof form.features === 'string' ? form.features.split(',').map(f => f.trim()) : form.features };
    if (editingPlan) payload._id = editingPlan._id;

    await fetch(`${backendURL}/pricing-api/admin/pricing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    setEditingPlan(null);
    setForm({ name: "", price: "", description: "", features: "", variant: "primary", isPopular: false });
    fetchPlans();
  };

  const deletePlan = async (id) => {
    if (window.confirm("Delete this tier?")) {
      await fetch(`${backendURL}/pricing-api/admin/pricing/${id}`, { method: "DELETE" });
      fetchPlans();
    }
  };

  return (
    <Section title="Pricing Manager" >
      <div className="row">
        {/* Editor Form */}
        <div className="col-lg-4">
          <Card style={{ top: '100px' }}>
            <h4 className="fw-bold mb-4">{editingPlan ? "Edit Tier" : "Add New Tier"}</h4>
            <form onSubmit={handleSubmit}>
              <Input label="Plan Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <Input label="Price ($)" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
              <Input label="Features (comma separated)" value={form.features} onChange={e => setForm({...form, features: e.target.value})} required />
              <div className="mb-3">
                <label className="label-ui">Variant (Color)</label>
                <select className="input-ui" value={form.variant} onChange={e => setForm({...form, variant: e.target.value})}>
                  <option value="primary">Orange (Brand)</option>
                  <option value="secondary">Gray (Soft)</option>
                  <option value="dark">Black (Strong)</option>
                </select>
              </div>
              <div className="form-check mb-4">
                <input className="form-check-input" type="checkbox" checked={form.isPopular} onChange={e => setForm({...form, isPopular: e.target.checked})} id="popularCheck" />
                <label className="form-check-label" htmlFor="popularCheck">Mark as Popular</label>
              </div>
              <Button type="submit" className="w-100">{editingPlan ? "Update Plan" : "Create Plan"}</Button>
              {editingPlan && <Button variant="secondary" className="w-100 mt-2" onClick={() => setEditingPlan(null)}>Cancel</Button>}
            </form>
          </Card>
        </div>

        {/* Plan List */}
        <div className="col-lg-8">
          <div className="row g-3">
            {plans.map(plan => (
              <div className="col-12" key={plan._id}>
                <Card className="d-flex justify-content-between align-items-center p-3">
                  <div>
                    <h5 className="fw-bold mb-0">{plan.name} <span className="text-muted small">${plan.price}/mo</span></h5>
                    <p className="small text-muted mb-0">{plan.features.length} features included</p>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn-icon" onClick={() => {setEditingPlan(plan); setForm({...plan, features: plan.features.join(', ')});}}>
                      <HiPencil />
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => deletePlan(plan._id)}>
                      <HiTrash />
                    </button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
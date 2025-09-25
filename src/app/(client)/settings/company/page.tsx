"use client";
import { useEffect, useState } from "react";
import { CountryDropdown, getCountriesList, Country } from "@/components/ui/CountryDropdown";
import { useStore } from "@/contexts/StoreContext";
import { businessesService } from "@/services/supabase/businesses";
import toast from "react-hot-toast";


export default function CompanySettingsPage() {
  const { currentBusiness, setCurrentBusiness } = useStore();
  const [form, setForm] = useState({
    name: "",
    store_type: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    countryCode: "CL"
  });
  const countriesList = getCountriesList();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentBusiness) {
      // Extraer código de país y número si el teléfono está en formato internacional
      let countryCode = "CL";
      let phone = currentBusiness.phone || "";
      if (phone.startsWith("+")) {
        const found = countriesList.find(c => phone.startsWith(c.callingCode));
        if (found) {
          countryCode = found.code;
          phone = phone.replace(found.callingCode, "");
        }
      }
      setForm({
        name: currentBusiness.name || "",
        store_type: currentBusiness.store_type || "",
        description: currentBusiness.description || "",
        address: currentBusiness.address || "",
        phone: phone,
        email: currentBusiness.email || "",
        countryCode: countryCode
      });
    }
  }, [currentBusiness]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleCountryChange = (code: string) => {
    setForm(f => ({ ...f, countryCode: code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    setLoading(true);
    // Guardar el teléfono en formato internacional: +código+número
    const callingCode = countriesList.find(c => c.code === form.countryCode)?.callingCode || "+56";
    const updateData = {
      name: form.name,
      store_type: form.store_type,
      description: form.description,
      address: form.address,
      phone: `${callingCode}${form.phone.replace(/\D/g, "")}`,
      email: form.email
    };
    const result = await businessesService.updateBusiness(currentBusiness.id, updateData);
    if (result.success && result.data) {
      setCurrentBusiness(result.data);
      toast.success("Datos actualizados correctamente");
    } else {
      toast.error(result.error || "Error actualizando datos");
    }
    setLoading(false);
  };

  if (!currentBusiness) {
    return <div className="p-8 text-center text-gray-500">No hay negocio seleccionado.</div>;
  }

  return (
    <div className="w-full px-0 sm:px-4 md:px-6 py-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Datos del Negocio</h1>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-white rounded-lg shadow p-4 sm:p-6 w-full max-w-full"
        style={{ minWidth: 0 }}
      >
        {/* Nombre */}
        <div className="col-span-1">
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-3 min-h-[48px] text-lg" required />
        </div>
        {/* Tipo de Negocio */}
        <div className="col-span-1">
          <label className="block text-sm font-medium mb-1">Tipo de Negocio</label>
          <input
            name="store_type"
            value={form.store_type === 'almacen' ? 'Almacén' : form.store_type}
            readOnly
            className="w-full border rounded px-3 py-3 min-h-[48px] bg-gray-100 text-gray-700 cursor-not-allowed"
            tabIndex={-1}
          />
        </div>
        {/* Email */}
        <div className="col-span-1">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-3 min-h-[48px]" />
        </div>
        {/* Descripción */}
        <div className="col-span-1 xl:col-span-2">
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-3 min-h-[48px]" rows={2} />
        </div>
        {/* Dirección */}
        <div className="col-span-1">
          <label className="block text-sm font-medium mb-1">Dirección</label>
          <input name="address" value={form.address} onChange={handleChange} className="w-full border rounded px-3 py-3 min-h-[48px]" />
        </div>
        {/* Teléfono */}
        <div className="col-span-1">
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <div className="relative flex items-center gap-1 border rounded px-2 py-1 min-h-[48px] focus-within:ring-2 focus-within:ring-blue-500 bg-white">
            <div className="flex-shrink-0" style={{ width: 56 }}>
              <CountryDropdown
                countriesList={countriesList}
                selectedCode={form.countryCode}
                onSelect={handleCountryChange}
                dropdownClassName="z-[1050]"
                containerClassName=""
              />
            </div>
            <span className="text-gray-900 font-medium text-base ml-1" style={{ minWidth: '48px', textAlign: 'center' }}>
              {countriesList.find(c => c.code === form.countryCode)?.callingCode || "+56"}
            </span>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="flex-1 pl-1 pr-2 py-2 bg-transparent outline-none border-0 min-h-[44px]"
              placeholder="123456789"
              style={{ minWidth: 0 }}
            />
          </div>
        </div>
        {/* Botón responsive alineado a la derecha */}
        <div className="col-span-1 md:col-span-2 xl:col-span-3 mt-2 flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-1/2 lg:w-1/2 xl:w-1/2 py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 text-lg transition-all"
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

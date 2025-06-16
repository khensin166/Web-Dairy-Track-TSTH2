import { useEffect, useState } from "react";
import {
  getReproductionById,
  updateReproduction,
} from "../../../../controllers/reproductionController";
import { listCows } from "../../../../controllers/cowsController";
import Swal from "sweetalert2";




const ReproductionEditPage = ({ reproductionId, onClose, onSaved }) => {
  const [form, setForm] = useState({
    cow: "",
    calving_date: "",
    previous_calving_date: "",
    insemination_date: "",
    total_insemination: "",
    edited_by: "", // ✅ tambahkan

  });



  const [cowName, setCowName] = useState("-");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.id || user?.user_id;
      if (userId) {
        setForm((prev) => ({ ...prev, edited_by: userId }));
      }

      const reproduction = await getReproductionById(reproductionId);
      const cowRes = await listCows();
      const cows = Array.isArray(cowRes) ? cowRes : cowRes.cows || [];

      const cowId = typeof reproduction.cow === "object" ? reproduction.cow.id : reproduction.cow;
      const cow = cows.find((c) => c.id === cowId);
      setCowName(cow ? `${cow.name} (${cow.breed})` : "Data sapi tidak ditemukan");

      setForm((prev) => ({
        ...prev,
        cow: cowId,
        calving_date: reproduction.calving_date || "",
        previous_calving_date: reproduction.previous_calving_date || "",
        insemination_date: reproduction.insemination_date || "",
        total_insemination: reproduction.total_insemination ?? "",
        successful_pregnancy: "1", // default 1
      }));
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      setError("Gagal memuat data reproduksi.");
    } finally {
      setLoading(false);
    }
  };

  if (reproductionId) fetchData();
}, [reproductionId]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const tglCalving = new Date(form.calving_date);
    const tglPrev = new Date(form.previous_calving_date);
    const tglIB = new Date(form.insemination_date);
    const totalIB = parseInt(form.total_insemination);

    if (tglPrev >= tglCalving) {
      setError("📌 Tanggal calving sebelumnya harus lebih awal dari calving sekarang.");
      setSubmitting(false);
      return;
    }

    if (tglIB <= tglCalving) {
      setError("📌 Tanggal inseminasi harus setelah tanggal calving sekarang.");
      setSubmitting(false);
      return;
    }

    if (isNaN(totalIB) || totalIB < 1) {
      setError("📌 Jumlah inseminasi harus lebih dari 0.");
      setSubmitting(false);
      return;
    }

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const editedBy = user?.id;
    await updateReproduction(reproductionId, {
  cow: form.cow,
  calving_date: form.calving_date,
  previous_calving_date: form.previous_calving_date,
  insemination_date: form.insemination_date,
  total_insemination: totalIB,
  successful_pregnancy: 1,
  edited_by: form.edited_by, // pakai dari form agar konsisten
});
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data reproduksi berhasil diperbarui.",
        timer: 1500,
        showConfirmButton: false,
      });
      if (onSaved) onSaved();
    } catch (err) {
      setError("❌ Gagal menyimpan perubahan. Silakan coba lagi.");
  
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: "Terjadi kesalahan saat memperbarui data.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", minHeight: "100vh" }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content p-4 text-center">
            <div className="spinner-border text-info" role="status" />
            <p className="mt-2">Memuat data reproduksi...</p>

          </div>
        </div>
      </div>
    );
  }

return (
  <div
    className="modal fade show d-block"
    style={{ background: "rgba(0,0,0,0.5)", minHeight: "100vh", paddingTop: "3rem" }}
  >
    <div className="modal-dialog modal-lg">
      <div className="modal-content">
        <div className="modal-header">
          <h4 className="modal-title text-info fw-bold">Edit Data Reproduksi</h4>
          <button className="btn-close" onClick={onClose} disabled={submitting}></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-danger text-center">{error}</div>}
          <form onSubmit={handleSubmit}>
            {/* Info Sapi */}
            <div className="mb-3">
              <label className="form-label fw-bold">Sapi</label>
              <input type="text" className="form-control" value={cowName} readOnly disabled />
            </div>

            {/* Tanggal Calving */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Tanggal Calving Sekarang</label>
                <input
                  type="date"
                  name="calving_date"
                  value={form.calving_date}
                  onChange={handleChange}
                  className="form-control"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Tanggal Calving Sebelumnya</label>
                <input
                  type="date"
                  name="previous_calving_date"
                  value={form.previous_calving_date}
                  onChange={handleChange}
                  className="form-control"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Inseminasi */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Tanggal Inseminasi</label>
                <input
                  type="date"
                  name="insemination_date"
                  value={form.insemination_date}
                  onChange={handleChange}
                  className="form-control"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Jumlah Inseminasi</label>
                <input
                  type="number"
                  name="total_insemination"
                  value={form.total_insemination}
                  onChange={handleChange}
                  className="form-control"
                  required
                  min={1}
                  disabled={submitting}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-info w-100" disabled={submitting}>
              {submitting ? "Memperbarui..." : "Perbarui Data"}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
);


};

export default ReproductionEditPage;

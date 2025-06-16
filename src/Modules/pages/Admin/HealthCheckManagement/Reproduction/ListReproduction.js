import { useEffect, useState } from "react";
import {
  deleteReproduction,
  getReproductions,
} from "../../../../controllers/reproductionController";
import { listCows } from "../../../../controllers/cowsController";
import { listCowsByUser } from "../../../../../Modules/controllers/cattleDistributionController";
import ReproductionCreatePage from "./CreateReproduction";
import ReproductionEditPage from "./EditReproduction";
import Swal from "sweetalert2";
import {
  Button,
  Card,
  Table,
  Spinner,
  InputGroup,
  FormControl,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";

const ReproductionListPage = () => {
  const [data, setData] = useState([]);
  const [cows, setCows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [modalType, setModalType] = useState(null);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 7;

  const user = JSON.parse(localStorage.getItem("user"));
  const [currentUser, setCurrentUser] = useState(null);
  const [userManagedCows, setUserManagedCows] = useState([]);

   const isAdmin = currentUser?.role_id === 1;
const isSupervisor = currentUser?.role_id === 2;

  const getCowName = (id) => {
    const cowArray = Array.isArray(cows) ? cows : [];
    const cow = cowArray.find((c) => c.id === id || c.id === id?.id);
    return cow ? `${cow.name} (${cow.breed})` : "Tidak diketahui";
  };

  const filteredData = data.filter((item) => {
    const cowName = getCowName(item.cow)?.toLowerCase() || "";
    return cowName.includes(searchTerm.toLowerCase());
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getReproductions();
      const cowList = await listCows();
      const parsedCows = Array.isArray(cowList) ? cowList : cowList?.cows || [];
      setCows(parsedCows);

      const isAdmin = currentUser?.role_id === 1;
      const isSupervisor = currentUser?.role_id === 2;

      let filtered = Array.isArray(res) ? res : [];

      if (!isAdmin && !isSupervisor && userManagedCows.length > 0) {
        filtered = filtered.filter((item) => {
          const cow = item.cow;
          const cowId = typeof cow === "object" ? cow?.id : cow;
          return userManagedCows.some((c) => String(c.id) === String(cowId));
        });
      }

      setData(filtered);
      setError("");
    } catch (err) {
      console.error("❌ Gagal mengambil data:", err.message);
      setError("Gagal mengambil data. Pastikan server API aktif.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    try {
      await deleteReproduction(id);
      await fetchData();
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Data reproduksi berhasil dihapus.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: "Terjadi kesalahan saat menghapus data.",
      });
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(userData);

    const fetchUserCows = async () => {
      if (!userData) return;
      try {
        const { success, cows } = await listCowsByUser(userData.user_id || userData.id);
        if (success) setUserManagedCows(cows || []);
      } catch (err) {
        console.error("Gagal mengambil sapi user:", err);
      }
    };

    fetchUserCows();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const isAdmin = currentUser.role_id === 1;
    const isSupervisor = currentUser.role_id === 2;

    if (isAdmin || isSupervisor) {
      fetchData();
    } else if (userManagedCows.length > 0) {
      fetchData();
    }
  }, [userManagedCows, currentUser]);

  return (
    <div className="container-fluid mt-4">
      <Card className="shadow-lg border-0 rounded-lg">
        <Card.Header className="bg-gradient-primary text-grey py-3">
          <h4 className="mb-0 text-primary fw-bold">
            <i className="fas fa-baby me-2" /> Data Reproduksi
          </h4>
        </Card.Header>

        <Card.Body>
          {/* 🔍 Pencarian dan Tambah */}
          <div className="d-flex justify-content-between mb-3">
            <InputGroup style={{ maxWidth: "300px" }}>
              <FormControl
                placeholder="Cari nama sapi..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </InputGroup>

          <OverlayTrigger
  placement="top"
  overlay={
    <Tooltip id="tooltip-tambah-reproduksi">
      {(isAdmin || isSupervisor)
        ? (isAdmin
            ? "Admin tidak dapat menambahkan data reproduksi"
            : "Supervisor tidak dapat menambahkan data reproduksi")
        : "Tambah Reproduksi"}
    </Tooltip>
  }
>
  <span className="d-inline-block">
    <Button
      variant="info"
      onClick={() => {
        if (isAdmin || isSupervisor) return;

        const femaleCows =
          Array.isArray(userManagedCows) &&
          userManagedCows.filter(
            (cow) => cow.gender?.toLowerCase() === "female"
          );

        if (!femaleCows || femaleCows.length === 0) {
          Swal.fire({
            icon: "warning",
            title: "Tidak Ada Sapi Betina",
            text: "Tidak dapat menambahkan reproduksi karena tidak ada sapi betina yang tersedia.",
          });
          return;
        }

        setModalType("create");
      }}
      disabled={isAdmin || isSupervisor}
      style={{
        pointerEvents: (isAdmin || isSupervisor) ? "none" : "auto",
      }}
    >
      <i className="fas fa-plus me-2" />
      Tambah Reproduksi
    </Button>
  </span>
</OverlayTrigger>

          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="info" />
              <p className="mt-3 text-muted">Memuat data reproduksi...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <p className="text-muted">Belum ada data reproduksi.</p>
          ) : (
            <>
              <div className="table-responsive">
                <Table bordered hover className="align-middle text-sm">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Nama Sapi</th>
                      <th>Calving Interval</th>
                      <th>Service Period</th>
                      <th>Conception Rate</th>
                      <th>Tanggal Dicatat</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                        <td>{getCowName(item.cow)}</td>
                        <td>{item.calving_interval || "-"}</td>
                        <td>{item.service_period || "-"}</td>
                        <td>{item.conception_rate != null ? item.conception_rate + " %" : "-"}</td>
                        <td>
                          {item.recorded_at
                            ? new Date(item.recorded_at).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td>
                          <OverlayTrigger
  placement="top"
  overlay={
    <Tooltip id="tooltip-edit-reproduksi">
      {(isAdmin || isSupervisor)
        ? (isAdmin
            ? "Admin tidak dapat mengedit data reproduksi"
            : "Supervisor tidak dapat mengedit data reproduksi")
        : "Edit Data Reproduksi"}
    </Tooltip>
  }
>
  <span className="d-inline-block">
    <Button
      variant="outline-warning"
      size="sm"
      className="me-2"
      onClick={() => {
        if (isAdmin || isSupervisor) return;

        setEditId(item.id);
        setModalType("edit");
      }}
      disabled={isAdmin || isSupervisor}
      style={{
        pointerEvents: (isAdmin || isSupervisor) ? "none" : "auto",
      }}
    >
      <i className="fas fa-edit" />
    </Button>
  </span>
</OverlayTrigger>


                 <OverlayTrigger
  placement="top"
  overlay={
    <Tooltip id="tooltip-hapus-reproduksi">
      {(isAdmin || isSupervisor)
        ? (isAdmin
            ? "Admin tidak dapat menghapus data reproduksi"
            : "Supervisor tidak dapat menghapus data reproduksi")
        : "Data reproduksi tidak dapat dihapus karena merupakan arsip medis"}
    </Tooltip>
  }
>
  <span className="d-inline-block">
    <Button
      variant="outline-danger"
      size="sm"
      onClick={() => {
        // ❌ Blok semua role
        Swal.fire({
          icon: "info",
          title: "Data Tidak Bisa Dihapus",
          text: "Data ini merupakan arsip reproduksi dan tidak dapat dihapus.",
          confirmButtonText: "Mengerti",
        });
      }}
      disabled
      style={{
        pointerEvents: "none", // agar tooltip tetap muncul walau tombol disabled
      }}
    >
      <i className="fas fa-trash" />
    </Button>
  </span>
</OverlayTrigger>


                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="d-flex justify-content-center align-items-center mt-3">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Prev
                  </Button>
                  <span className="fw-semibold">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="ms-2"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Modal Tambah */}
          {modalType === "create" && (
            <ReproductionCreatePage
              onClose={() => setModalType(null)}
              onSaved={() => {
                fetchData();
                setModalType(null);
              }}
            />
          )}

          {/* Modal Edit */}
          {modalType === "edit" && editId && (
            <ReproductionEditPage
              reproductionId={editId}
              onClose={() => {
                setEditId(null);
                setModalType(null);
              }}
              onSaved={() => {
                fetchData();
                setEditId(null);
                setModalType(null);
              }}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ReproductionListPage;

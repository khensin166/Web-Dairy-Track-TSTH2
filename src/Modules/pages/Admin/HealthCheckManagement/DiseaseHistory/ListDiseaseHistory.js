  // 📄 File: DiseaseHistoryListPage.js
  import { useEffect, useState } from "react";
  import { listCows } from "../../../../controllers/cowsController";
  import { getHealthChecks } from "../../../../controllers/healthCheckController";
  import { getSymptoms } from "../../../../controllers/symptomController";
  import {
    getDiseaseHistories,
    deleteDiseaseHistory,
  } from "../../../../controllers/diseaseHistoryController";
  import DiseaseHistoryCreatePage from "./CreateDiseaseHistory";
  import DiseaseHistoryEditPage from "./EditDiseaseHistory";
  import ViewDiseaseHistory from "./ViewDiseaseHistory";
  import Swal from "sweetalert2";
  import {
    Table,
    Button,
    OverlayTrigger,
    Tooltip,
    Badge,
    Card,
    Spinner,
    InputGroup,
    FormControl,
  } from "react-bootstrap";
  import { listCowsByUser } from "../../../../../Modules/controllers/cattleDistributionController";


  const DiseaseHistoryListPage = () => {
    const [data, setData] = useState([]);
    const [cows, setCows] = useState([]);
    const [checks, setChecks] = useState([]);
    const [healthChecks, setHealthChecks] = useState([]);
    const [symptoms, setSymptoms] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("user"));
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 7;
    const [currentUser, setCurrentUser] = useState(null);
    const [userManagedCows, setUserManagedCows] = useState([]);
    const [viewModalData, setViewModalData] = useState(null);
    const [viewModalShow, setViewModalShow] = useState(false);

 const isAdmin = currentUser?.role_id === 1;
const isSupervisor = currentUser?.role_id === 2;


    useEffect(() => {
      const userData = JSON.parse(localStorage.getItem("user"));
      setCurrentUser(userData);

      const fetchUserCows = async () => {
        if (!userData) return;
        try {
          const { success, cows } = await listCowsByUser(
            userData.user_id || userData.id
          );
          if (success) setUserManagedCows(cows || []);
        } catch (err) {
          console.error("Gagal mengambil sapi user:", err);
        }
      };
      fetchUserCows();
    }, []);

    const fetchData = async () => {
      setLoading(true);
      try {
        const [cowList, historyList, checkList, symptomList] = await Promise.all([
          listCows(),
          getDiseaseHistories(),
          getHealthChecks(),
          getSymptoms(),
        ]);

        const allCows = Array.isArray(cowList) ? cowList : Array.isArray(cowList?.cows) ? cowList.cows : [];
        const allChecks = Array.isArray(checkList) ? checkList : [];

        setCows(allCows);
        setChecks(allChecks);
        setHealthChecks(allChecks);
        setSymptoms(Array.isArray(symptomList) ? symptomList : []);

        const isAdmin = currentUser?.role_id === 1;
        const isSupervisor = currentUser.role_id === 2;

        let filteredHistories = historyList;

        if (!isAdmin && !isSupervisor && userManagedCows.length > 0) {
          const allowedCowIds = userManagedCows.map((cow) => cow.id);

          filteredHistories = historyList.filter((history) => {
            const hcId = typeof history.health_check === "object" ? history.health_check.id : history.health_check;
            const hc = allChecks.find((c) => c.id === hcId);
            const cowId = typeof hc?.cow === "object" ? hc.cow.id : hc?.cow;
            return hc && allowedCowIds.includes(cowId);
          });
        }

        setData(filteredHistories || []);
        setError("");
      } catch (err) {
        console.error("Gagal memuat data:", err.message);
        setError("Gagal memuat data. Pastikan server API berjalan.");
      } finally {
        setLoading(false);
      }
    };

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

    const resolveCheck = (hc) => (typeof hc === "object" ? hc.id : hc);
    const resolveCow = (c) => (typeof c === "object" ? c.id : c);

    const filteredData = data.filter((item) => {
    const hcId = resolveCheck(item.health_check);
    const check = checks.find((c) => c.id === hcId);
    const cowId = resolveCow(check?.cow);
    const cow = cows.find((c) => c.id === cowId);
    const cowName = cow ? `${cow.name} (${cow.breed})`.toLowerCase() : "";
    return cowName.includes(searchTerm.toLowerCase());
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

    const handleDelete = async (id) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await deleteDiseaseHistory(id);
      await fetchData(); // refresh data setelah hapus
      setDeleteId(null);
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Riwayat penyakit berhasil dihapus.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: "Terjadi kesalahan saat menghapus data.",
      });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="container-fluid mt-4">
      <Card className="shadow-lg border-0 rounded-lg">
        <Card.Header className="bg-gradient-primary text-grey py-3">
          <h4 className="mb-0 text-primary fw-bold">
            <i className="fas fa-notes-medical me-2" /> Riwayat Penyakit
          </h4>
        </Card.Header>

        <Card.Body>
          {/* 🔍 Search dan Button Tambah */}
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
    <Tooltip id="tooltip-tambah-riwayat">
      {(isAdmin || isSupervisor)
        ? (isAdmin
            ? "Admin tidak dapat menambahkan riwayat penyakit"
            : "Supervisor tidak dapat menambahkan riwayat penyakit")
        : "Tambah Riwayat"}
    </Tooltip>
  }
>
  <span className="d-inline-block">
    <Button
      variant="info"
      onClick={() => {
        if (isAdmin || isSupervisor) return;

        const noAvailableCheck = healthChecks.filter((check) => {
          const status = (check.status || "").toLowerCase();
          const cowId =
            typeof check?.cow === "object" ? check.cow.id : check?.cow;
          const isOwned = userManagedCows.some((cow) => cow.id === cowId);
          return status !== "handled" && status !== "healthy" && isOwned;
        }).length === 0;

        if (noAvailableCheck) {
          Swal.fire({
            icon: "warning",
            title: "Tidak Bisa Menambahkan Riwayat Penyakit",
            text: "Tidak ada pemeriksaan yang tersedia. Semua pemeriksaan mungkin telah ditangani, sehat, atau bukan milik sapi Anda.",
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
      Tambah Riwayat
    </Button>
  </span>
</OverlayTrigger>

          </div>

          {/* 🔄 Konten */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="info" />
              <p className="mt-2 text-muted">Memuat data riwayat penyakit...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : filteredData.length === 0 ? (
            <p className="text-muted">Tidak ada data riwayat penyakit.</p>
          ) : (
            <>
              <div className="table-responsive">
                <Table bordered hover className="align-middle text-sm">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Tanggal</th>
                      <th>Sapi</th>
                      <th>Penyakit</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item, idx) => {
                      const hcId = resolveCheck(item.health_check);
                      const check = checks.find((c) => c.id === hcId);
                      const symptom = symptoms.find((s) => resolveCheck(s.health_check) === hcId);
                      const cowId = resolveCow(check?.cow);
                      const cow = cows.find((c) => c.id === cowId);

                      return (
                        <tr key={item.id}>
                          <td>{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                          <td>{new Date(item.created_at).toLocaleDateString("id-ID")}</td>
                          <td>{cow ? `${cow.name} (${cow.breed})` : check?.cow ? `ID: ${cowId}` : "-"}</td>
                          <td>{item.disease_name}</td>
                          <td>
                            {check?.status === "handled" ? (
                              <Badge bg="success">Sudah Ditangani</Badge>
                            ) : (
                              <Badge bg="warning" text="dark">Belum Ditangani</Badge>
                            )}
                          </td>
                          <td>
                            {/* Aksi: Lihat, Edit, Hapus */}
                            <OverlayTrigger overlay={<Tooltip>Lihat Detail</Tooltip>}>
                              <Button
                                variant="outline-info"
                                size="sm"
                                className="me-2"
                                onClick={() => {
                                  setViewModalData({ history: item, check, symptom, cow });
                                  setViewModalShow(true);
                                }}
                              >
                                <i className="fas fa-eye" />
                              </Button>
                            </OverlayTrigger>

                            <OverlayTrigger
  placement="top"
  overlay={
    <Tooltip id="tooltip-edit">
      {(isAdmin || isSupervisor)
        ? (isAdmin
            ? "Admin tidak dapat mengedit data"
            : "Supervisor tidak dapat mengedit data")
        : "Edit"}
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
    <Tooltip id="tooltip-hapus-riwayat">
      {(isAdmin || isSupervisor)
        ? (isAdmin
            ? "Admin tidak dapat menghapus riwayat penyakit"
            : "Supervisor tidak dapat menghapus riwayat penyakit")
        : "Data riwayat tidak dapat dihapus karena merupakan arsip medis"}
    </Tooltip>
  }
>
  <span className="d-inline-block">
    <Button
      variant="outline-danger"
      size="sm"
      onClick={() => {
        // Tidak akan pernah dijalankan karena tombol disabled
        Swal.fire({
          icon: "info",
          title: "Data Tidak Bisa Dihapus",
          text: "Data ini merupakan arsip medis dan tidak dapat dihapus.",
          confirmButtonText: "Mengerti",
        });
      }}
      disabled
      style={{
        pointerEvents: "none", // agar tooltip tetap muncul meskipun tombol disabled
      }}
    >
      <i className="fas fa-trash" />
    </Button>
  </span>
</OverlayTrigger>



                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              {/* 🔁 Pagination */}
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
                  <span className="fw-semibold">Halaman {currentPage} dari {totalPages}</span>
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

          {/* Modal Tambah/Edit/Lihat */}
          {modalType === "create" && (
            <DiseaseHistoryCreatePage
              onClose={() => setModalType(null)}
              onSaved={() => {
                fetchData();
                setModalType(null);
              }}
            />
          )}

          {modalType === "edit" && editId && (
            <DiseaseHistoryEditPage
              historyId={editId}
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

          {viewModalData && (
            <ViewDiseaseHistory
              show={viewModalShow}
              onClose={() => {
                setViewModalShow(false);
                setViewModalData(null);
              }}
              history={viewModalData.history}
              check={viewModalData.check}
              symptom={viewModalData.symptom}
              cow={viewModalData.cow}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );


  };

  export default DiseaseHistoryListPage;

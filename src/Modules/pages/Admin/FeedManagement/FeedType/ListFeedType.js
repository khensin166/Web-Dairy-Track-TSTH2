// FeedTypeListPage.js
import React, { useEffect, useState } from "react";
import {
  addFeedType,
  getFeedTypeById,
  listFeedTypes,
  updateFeedType,
  deleteFeedType,
  exportFeedTypesToPDF,
  exportFeedTypesToExcel,
} from "../../../../controllers/feedTypeController";
import FeedTypeCreatePage from "./CreateFeedType";
import Swal from "sweetalert2";
import {
  Button,
  Card,
  Table,
  Spinner,
  Modal,
  Row,
  Col,
  Form,
  InputGroup,
  FormControl,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";

const FeedTypeListPage = () => {
  const [data, setData] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const PAGE_SIZE = 6;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isSupervisor = user?.role === "Supervisor";

  const disableIfSupervisor = isSupervisor
    ? {
        disabled: true,
        title: "Supervisor tidak dapat mengedit data",
        style: { opacity: 0.5, cursor: "not-allowed" },
      }
    : {};

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await listFeedTypes();
      if (response.success) {
        setData(response.feedTypes || []);
      } else {
        if (response.message.includes("Token")) {
          Swal.fire({
            icon: "error",
            title: "Sesi Berakhir",
            text: "Token tidak valid atau kedaluwarsa. Silakan login kembali.",
          });
          localStorage.removeItem("user");
          window.location.href = "/";
        } else {
          Swal.fire("Error", response.message || "Gagal memuat data.", "error");
        }
        setData([]);
      }
    } catch (err) {
      Swal.fire("Error", "Gagal memuat data.", "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await deleteFeedType(deleteId);
      if (response.success) {
        setData((prev) => prev.filter((item) => item.id !== deleteId));
        setDeleteId(null);
      } else {
        if (response.message.includes("Token")) {
          Swal.fire({
            icon: "error",
            title: "Sesi Berakhir",
            text: "Token tidak valid atau kedaluwarsa. Silakan login kembali.",
          });
          localStorage.removeItem("user");
          window.location.href = "/";
        } else {
          Swal.fire("Error", response.message || "Gagal menghapus jenis pakan.", "error");
        }
      }
    } catch (err) {
      Swal.fire("Error", "Terjadi kesalahan saat menghapus jenis pakan.", "error");
      console.error(err);
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportFeedTypesToPDF();
    } catch (err) {
      Swal.fire("Error", "Gagal mengekspor ke PDF.", "error");
      console.error(err);
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportFeedTypesToExcel();
    } catch (err) {
      Swal.fire("Error", "Gagal mengekspor ke Excel.", "error");
      console.error(err);
    }
  };

  const paginatedData = data
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
  if (!user.token) {
    localStorage.removeItem("user");
    window.location.href = "/";
  } else {
    fetchData();
  }
}, []);

  useEffect(() => {
    if (deleteId) {
      Swal.fire({
        title: "Yakin ingin menghapus?",
        text: "Data yang dihapus tidak dapat dikembalikan.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Ya, Hapus!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          handleDelete();
        } else {
          setDeleteId(null);
        }
      });
    }
  }, [deleteId]);

  return (
    <div className="container-fluid mt-4">
      <Card className="shadow-lg border-0 rounded-lg">
        <Card.Header className="bg-gradient-primary text-grey py-3">
          <h4 className="mb-0 text-primary fw-bold">
            <i className="fas fa-leaf me-2" /> Jenis Pakan
          </h4>
        </Card.Header>

        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            <InputGroup style={{ maxWidth: "300px" }}>
              <FormControl
                placeholder="Cari nama jenis pakan..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </InputGroup>
            <div>
              <Button
                variant="outline-primary"
                className="me-2"
                onClick={handleExportPDF}
                {...disableIfSupervisor}
              >
                <i className="fas fa-file-pdf me-2" /> Ekspor PDF
              </Button>
              <Button
                variant="outline-success"
                className="me-2"
                onClick={handleExportExcel}
                {...disableIfSupervisor}
              >
                <i className="fas fa-file-excel me-2" /> Ekspor Excel
              </Button>
              <Button
                variant="primary"
                onClick={() => !isSupervisor && setModalType("create")}
                {...disableIfSupervisor}
              >
                <i className="fas fa-plus me-2" /> Tambah
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Memuat data jenis pakan...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table bordered hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Nama Jenis Pakan</th>
                    <th>Pemilik</th>
                    <th>Dibuat Oleh</th>
                    <th>Diperbarui Oleh</th>
                    <th>Tanggal Dibuat</th>
                    <th>Tanggal Diperbarui</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted">
                        Tidak ada data ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                        <td>{item.name}</td>
                        <td>{item.user_name || "Tidak diketahui"}</td>
                        <td>
                          {item.created_by
                            ? item.created_by.name
                            : "Tidak diketahui"}
                        </td>
                        <td>
                          {item.updated_by
                            ? item.updated_by.name
                            : "Tidak diketahui"}
                        </td>
                        <td>
                          {new Date(item.created_at).toLocaleDateString("id-ID")}
                        </td>
                        <td>
                          {new Date(item.updated_at).toLocaleDateString("id-ID")}
                        </td>
                        <td>
                          <OverlayTrigger overlay={<Tooltip>Edit</Tooltip>}>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              className="me-2"
                              onClick={() => {
                                if (!isSupervisor) {
                                  window.location.href = `/admin/edit-feedType/${item.id}`;
                                }
                              }}
                              {...disableIfSupervisor}
                            >
                              <i className="fas fa-edit" />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger overlay={<Tooltip>Hapus</Tooltip>}>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                !isSupervisor && setDeleteId(item.id)
                              }
                              {...disableIfSupervisor}
                            >
                              <i className="fas fa-trash" />
                            </Button>
                          </OverlayTrigger>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {Math.ceil(data.length / PAGE_SIZE) > 1 && (
            <div className="d-flex justify-content-end">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Prev
              </Button>
              <span className="align-self-center">
                Page {currentPage} of {Math.ceil(data.length / PAGE_SIZE)}
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                className="ms-2"
                disabled={currentPage === Math.ceil(data.length / PAGE_SIZE)}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}

          {modalType === "create" && (
            <FeedTypeCreatePage
              onClose={() => setModalType(null)}
              onSaved={() => {
                fetchData();
                setModalType(null);
              }}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default FeedTypeListPage;
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Pencil, Phone, Trash2, Truck } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Modal from '../components/common/Modal.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { StatusBadge, Tag } from '../components/common/Badge.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useServices from '../hooks/useServices.js';
import { buildVendorLookups } from '../features/vendors/vendorLookups.js';
import { VENDOR_STATUSES } from '../features/vendors/vendorStatus.js';

const dateTime = (date) =>
  date ? date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

function Detail({ label, children, className }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 break-words font-medium">{children || '—'}</dd>
    </div>
  );
}

function DeleteVendorModal({ vendor, onClose, onDeleted }) {
  const { removeVendor } = useAppData();
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    setDeleting(true);
    try {
      await removeVendor(vendor.id);
      showToast(`${vendor.name} deleted.`);
      onDeleted();
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      setDeleting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Delete ${vendor.name}?`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" icon={Trash2} disabled={deleting} onClick={confirm}>
            {deleting ? 'Deleting…' : 'Delete vendor'}
          </Button>
        </>
      }
    >
      <p className="text-sm">The vendor will be removed for everyone. This can’t be undone.</p>
    </Modal>
  );
}

export default function VendorDetailPage() {
  const { vendorId } = useParams();
  const { vendors, vendorsLoading } = useAppData();
  const { services } = useServices();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const lookups = useMemo(() => buildVendorLookups(services), [services]);
  const vendor = vendors.find((v) => v.id === vendorId);

  if (vendorsLoading) return <p className="py-10 text-center text-[13px] text-muted">Loading vendor…</p>;
  if (!vendor) {
    return (
      <EmptyState
        icon={Truck}
        title="Vendor not found"
        description="This vendor may have been deleted."
        action={<Button to="/vendors" variant="primary">Back to vendors</Button>}
      />
    );
  }

  const categoryNames = lookups.categoryNames(vendor);
  const serviceRows = lookups.servicesByCategory(vendor);
  const subCount = serviceRows.reduce((total, row) => total + row.services.length, 0);
  const place = [vendor.city, vendor.district, vendor.state].filter(Boolean).join(', ');

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title={vendor.name}
        breadcrumbs={[{ label: 'Vendors', to: '/vendors' }, { label: vendor.name }]}
        subtitle={place || 'No location saved'}
        actions={
          <>
            <Button to="/vendors" icon={ArrowLeft}>
              Back to vendors
            </Button>
            <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
            <Button to={`/vendors/${vendor.id}/edit`} variant="primary" icon={Pencil}>
              Edit vendor
            </Button>
          </>
        }
      >
        <StatusBadge value={vendor.status} />
      </PageHeader>

      <div className="grid grid-cols-1 gap-5.5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Contact details" />
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label="Vendor name">{vendor.name}</Detail>
            <Detail label="Contact person">{vendor.contactPerson}</Detail>
            <Detail label="Phone">
              <a href={`tel:${vendor.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-brand-ink">
                <Phone className="size-3.5" aria-hidden="true" /> {vendor.phone}
              </a>
            </Detail>
            <Detail label="Email">
              {vendor.email && (
                <a href={`mailto:${vendor.email}`} className="inline-flex items-center gap-1.5 break-all hover:text-brand-ink">
                  <Mail className="size-3.5 shrink-0" aria-hidden="true" /> {vendor.email}
                </a>
              )}
            </Detail>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Location & address" />
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Detail label="State">{vendor.state}</Detail>
            <Detail label="District">{vendor.district}</Detail>
            <Detail label="City">{vendor.city}</Detail>
            <Detail label="Full address" className="sm:col-span-3">
              {vendor.address && (
                <span className="inline-flex items-start gap-1.5">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-pre-line">{vendor.address}</span>
                </span>
              )}
            </Detail>
          </dl>
        </Card>
      </div>

      <Card>
        <CardHeader title={`Categories · ${categoryNames.length}`} />
        {categoryNames.length ? (
          <div className="flex flex-wrap gap-2">
            {categoryNames.map((name) => (
              <span key={name} className="rounded-full bg-navy px-3 py-1.5 text-[13px] font-medium text-white">
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted">No categories selected.</p>
        )}
      </Card>

      <Card>
        <CardHeader title={`Services · ${subCount}`} subtitle="Grouped by category" />
        {serviceRows.length ? (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {serviceRows.map(({ category, services: names }) => (
              <li key={category.id} className="rounded-xl border border-line p-3.5">
                <b>{category.name}</b>
                {names.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {names.map((name) => (
                      <Tag key={name}>{name}</Tag>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-[13px] text-muted">No services selected in this category.</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted">No categories or services selected.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Status & record" />
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Detail label="Vendor status">
            <span className="flex flex-col items-start gap-1">
              <StatusBadge value={vendor.status} />
              <span className="text-[12.5px] font-normal text-muted">{VENDOR_STATUSES.find((s) => s.value === vendor.status)?.help}</span>
            </span>
          </Detail>
          <Detail label="Created">{dateTime(vendor.createdAt)}</Detail>
          <Detail label="Last updated">{dateTime(vendor.updatedAt)}</Detail>
        </dl>
      </Card>

      {deleteOpen && <DeleteVendorModal vendor={vendor} onClose={() => setDeleteOpen(false)} onDeleted={() => navigate('/vendors', { replace: true })} />}
    </div>
  );
}

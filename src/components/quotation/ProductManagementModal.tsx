'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Package,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Tag,
  DollarSign,
} from 'lucide-react';
import { ProductItem } from '@/types/quotation';
import { useQuotationStore } from '@/lib/quotation-store';
import Swal from 'sweetalert2';

interface ProductManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductManagementModal({
  isOpen,
  onClose,
}: ProductManagementModalProps) {
  const { products, createProduct, updateProduct, deleteProduct, currentUser } =
    useQuotationStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Media & Streaming');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(1000);
  const [unitLabel, setUnitLabel] = useState('รายการ');

  if (!isOpen) return null;

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setSku(`SKU-${Date.now().toString().slice(-4)}`);
    setName('');
    setCategory('Media & Streaming');
    setDescription('');
    setUnitPrice(1000);
    setUnitLabel('รายการ');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (prod: ProductItem) => {
    setEditingProduct(prod);
    setSku(prod.sku);
    setName(prod.name);
    setCategory(prod.category);
    setDescription(prod.description || '');
    setUnitPrice(prod.unitPrice);
    setUnitLabel(prod.unitLabel || 'รายการ');
    setIsFormOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกชื่อสินค้า',
        background: '#ffffff',
        color: '#0f172a',
      });
      return;
    }

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        sku,
        name,
        category,
        description,
        unitPrice: Number(unitPrice),
        unitLabel,
      });
    } else {
      await createProduct({
        sku,
        name,
        category,
        description,
        unitPrice: Number(unitPrice),
        unitLabel,
        isActive: true,
      });
    }

    setIsFormOpen(false);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'บันทึกข้อมูลสินค้าสำเร็จ',
      timer: 2000,
      showConfirmButton: false,
      background: '#ffffff',
      color: '#0f172a',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[88vh] overflow-hidden my-auto text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900">
                แคตตาล็อกสินค้า & บริการ (Product Catalog)
              </h2>
              <p className="text-xs text-slate-500">
                จัดการฐานข้อมูลสินค้าและอัตราค่าบริการมาตรฐานสำหรับดึงไปใช้ในใบเสนอราคา
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสินค้า, SKU, หมวดหมู่..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'ทุกหมวดหมู่' : c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มสินค้า / บริการใหม่</span>
            </button>
          </div>

          {/* Form Drawer (When Adding/Editing) */}
          {isFormOpen && (
            <form
              onSubmit={handleSaveProduct}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  {editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'สร้างรายการสินค้า / บริการใหม่'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">รหัสสินค้า (SKU)</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    ชื่อสินค้า / บริการ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น แพ็กเกจสตรีมมิ่ง YouTube Live 2 ชม."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">หมวดหมู่</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="เช่น Media & Streaming"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ราคาต่อหน่วย (บาท)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    placeholder="เช่น ชิ้น, รายการ, คลิป, แพ็กเกจ"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">รายละเอียดสินค้า (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="คำอธิบายสโคปงาน ข้อมูลสินค้า..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                >
                  บันทึกสินค้า
                </button>
              </div>
            </form>
          )}

          {/* Products List Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-xs text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">รหัส SKU</th>
                  <th className="px-4 py-3">ชื่อสินค้า / การบริการ</th>
                  <th className="px-4 py-3">หมวดหมู่</th>
                  <th className="px-4 py-3 text-right">ราคา / หน่วย</th>
                  <th className="px-4 py-3 text-center w-24">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      ไม่พบสินค้าในระบบ
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 font-mono font-medium text-blue-700">{p.sku}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        {p.description && (
                          <div className="text-[11px] text-slate-500 truncate max-w-md">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {p.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}.-
                        <span className="text-slate-500 font-normal ml-1">/{p.unitLabel}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                            title="แก้ไข"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>รวมสินค้าทั้งหมด {products.length} รายการ</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium shadow-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

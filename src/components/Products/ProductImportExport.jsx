import { useRef, useEffect } from 'react'
import { api } from '../../utils/api'
import { useToast } from '../../contexts/ToastContext'
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { DocumentArrowDownIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'

export default function ProductImportExport({ categories, subcategories, onImportComplete, onExportComplete }) {
  const toast = useToast()
  const pollingIntervalRef = useRef(null)
  const excelInputRef = useRef(null)

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const downloadExcel = async () => {
    try {
      onExportComplete?.({ loading: true })
      const response = await api.get('/admin/products/export')
      const allProducts = Array.isArray(response.data) ? response.data : (response.data.products || [])

      if (allProducts.length === 0) {
        toast.error('No products to export')
        onExportComplete?.({ loading: false })
        return
      }

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Products')

      const headers = [
        'SKU*', 'Item Name*', 'Short Description', 'Long Description',
        'Cost Price*', 'Retail Price*', 'Promotion Price', 'Promotion Start', 'Promotion End',
        'Gross Margin %', 'Staff Discount %', 'Tax Rate %', 'Stock Quantity*', 'Reorder Level*',
        'Shelf Location', 'Weight/Volume', 'Unit of Measure', 'Expiry Date',
        'Supplier', 'Country of Origin', 'Brand', 'Pack Size',
        'Gluten Free', 'Vegetarian', 'Vegan', 'Age Restricted', 'Minimum Age',
        'Allergen Info', 'Storage Type', 'Own Brand', 'Online Visible', 'Status',
        'Barcode', 'Batch Number', 'Category*', 'Subcategory', 'Franchise', 'Image URLs (add each URL after a new line)', 'Notes'
      ]
      worksheet.addRow(headers)

      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF8DB4E2' }
      }
      headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      headerRow.height = 30

      // Freeze the header row so it stays visible when scrolling
      worksheet.views = [
        { state: 'frozen', ySplit: 1, activeCell: 'A2' }
      ]

      worksheet.columns = [
        { width: 30 },  // SKU
        { width: 25 },  // Item Name
        { width: 25 },  // Short Description
        { width: 25 },  // Long Description
        { width: 10 },  // Cost Price
        { width: 10 },  // Retail Price
        { width: 10 },  // Promotion Price
        { width: 15 },  // Promotion Start
        { width: 15 },  // Promotion End
        { width: 10 },  // Gross Margin
        { width: 10 },  // Staff Discount
        { width: 10 },  // Tax Rate
        { width: 12 },  // Stock Quantity
        { width: 10 },  // Reorder Level
        { width: 15 },  // Shelf Location
        { width: 10 },  // Weight/Volume
        { width: 10 },  // Unit of Measure
        { width: 15 },  // Expiry Date
        { width: 15 },  // Supplier
        { width: 15 },  // Country of Origin
        { width: 15 },  // Brand
        { width: 10 },  // Pack Size
        { width: 10 },  // Gluten Free
        { width: 10 },  // Vegetarian
        { width: 10 },  // Vegan
        { width: 10 },  // Age Restricted
        { width: 10 },  // Minimum Age
        { width: 25 },  // Allergen Info
        { width: 15 },  // Storage Type
        { width: 10 },  // Own Brand
        { width: 10 },  // Online Visible
        { width: 10 },  // Status
        { width: 20 },  // Barcode
        { width: 20 },  // Batch Number
        { width: 15 },  // Category
        { width: 15 },  // Subcategory
        { width: 25 },  // Franchise
        { width: 60 },  // Image URLs
        { width: 30 },  // Notes
      ]

      allProducts.forEach((product) => {
        const imageUrls = product.images
          ?.map(img => img.image_url)
          .join('\n\n') || ''

        // Get subcategory name from subcategory_id
        let subcategoryName = ''
        if (product.subcategory?.name) {
          subcategoryName = product.subcategory.name
        } else if (product.subcategory_id) {
          const subcategory = subcategories.find(sub => sub.id === product.subcategory_id)
          subcategoryName = subcategory?.name || ''
        }

        const row = worksheet.addRow([
          product.sku || '',
          product.item_name || product.name || '',
          product.short_description || product.description || '',
          product.long_description || '',
          product.cost_price || '',
          product.retail_price || product.price || '',
          product.promotion_price || '',
          product.promotion_start ? product.promotion_start.split('T')[0] : '',
          product.promotion_end ? product.promotion_end.split('T')[0] : '',
          product.gross_margin || 0,
          product.staff_discount || 0,
          product.tax_rate || 0,
          product.stock_quantity !== undefined ? product.stock_quantity : (product.stock || 0),
          product.reorder_level || 0,
          product.shelf_location || '',
          product.weight_volume || 0,
          product.unit_of_measure || '',
          product.expiry_date ? product.expiry_date.split('T')[0] : '',
          product.supplier || '',
          product.country_of_origin || '',
          product.brand || '',
          product.pack_size || '',
          product.is_gluten_free ? 'Yes' : 'No',
          product.is_vegetarian ? 'Yes' : 'No',
          product.is_vegan ? 'Yes' : 'No',
          product.is_age_restricted ? 'Yes' : 'No',
          product.minimum_age || '',
          product.allergen_info || '',
          product.storage_type || '',
          product.is_own_brand ? 'Yes' : 'No',
          product.online_visible !== undefined ? (product.online_visible ? 'Yes' : 'No') : 'Yes',
          product.status || 'active',
          product.barcode || '',
          product.batch_number || '',
          product.category?.name || product.category_id || '',
          subcategoryName,
          '', // Franchise - populated by user
          imageUrls,
          product.notes || '',
        ])

        const idCell = row.getCell(1)
        idCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
        }
        idCell.font = { color: { argb: 'FF666666' } }

        row.eachCell((cell) => {
          cell.alignment = { vertical: 'top', wrapText: true }
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        })
      })

      const dropdownColumns = {
        'X': ['Yes', 'No'],
        'Y': ['Yes', 'No'],
        'Z': ['Yes', 'No'],
      }

      Object.entries(dropdownColumns).forEach(([col, options]) => {
        const colIndex = col.charCodeAt(0) - 64
        worksheet.getColumn(colIndex).eachCell((cell, rowNumber) => {
          if (rowNumber >= 2) {
            cell.dataValidation = {
              type: 'list',
              allowBlank: true,
              formulae: [`"${options.join(',')}"`],
              showErrorMessage: false,
            }
          }
        })
        
        for (let i = worksheet.rowCount + 1; i <= 1000; i++) {
          const cell = worksheet.getCell(`${col}${i}`)
          if (!cell.value) cell.value = ''
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`"${options.join(',')}"`],
            showErrorMessage: false,
          }
        }
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `products_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Products exported successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to export products')
    } finally {
      onExportComplete?.({ loading: false })
    }
  }

  const pollJobStatus = async (jobId) => {
    try {
      const response = await api.get(`/admin/products/batch/${jobId}`)
      const jobData = response.data

      onImportComplete?.({
        status: 'polling',
        batchProgress: {
          isOpen: true,
          jobId: jobId,
          status: jobData.status,
          progress: jobData.progress || 0,
          processed: jobData.processed || 0,
          total: jobData.total || 0,
          created: jobData.created !== undefined ? jobData.created : 0,
          updated: jobData.updated !== undefined ? jobData.updated : 0,
          deleted: jobData.deleted !== undefined ? jobData.deleted : 0,
          failed: jobData.failed !== undefined ? jobData.failed : 0,
          errors: jobData.errors || []
        }
      })

      if (jobData.status === 'completed' || jobData.status === 'failed') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }

        if (jobData.status === 'completed') {
          toast.success(
            `Batch completed: ${jobData.created} created, ${jobData.updated} updated, ${jobData.deleted} deleted`
          )
          if (jobData.failed > 0) {
            toast.warning(`${jobData.failed} products failed`)
          }
          onImportComplete?.({ status: 'completed', shouldRefresh: true })
        } else {
          toast.error('Batch processing failed')
          onImportComplete?.({ status: 'failed' })
        }

        setTimeout(() => {
          onImportComplete?.({ status: 'close-modal' })
        }, 3000)
      }
    } catch (error) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      toast.error('Failed to check batch status')
      onImportComplete?.({ status: 'close-modal' })
    }
  }

  const uploadExcel = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      onImportComplete?.({ loading: true })
      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          if (jsonData.length === 0) {
            toast.error('No data found in Excel file')
            onImportComplete?.({ loading: false })
            return
          }

          const validProducts = []
          const errors = []

          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i]
            const rowNum = i + 2

            const isEmpty = (value) => {
              return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
            }

            const hasData = Object.values(row).some(value => !isEmpty(value))
            
            if (!hasData) {
              continue
            }

            const rowErrors = {}

            // Required fields validation
            // SKU is optional - if not provided, backend will auto-generate it
            if (!isEmpty(row['SKU*']) && String(row['SKU*']).trim() === '') {
              rowErrors.sku = 'SKU cannot be empty if provided'
            }

            if (isEmpty(row['Item Name*']) || String(row['Item Name*']).trim() === '') {
              rowErrors.item_name = 'Item Name is required'
            }

            if (isEmpty(row['Cost Price*']) || isNaN(parseFloat(row['Cost Price*'])) || parseFloat(row['Cost Price*']) <= 0) {
              rowErrors.cost_price = 'Cost Price must be a valid number greater than 0'
            }

            if (isEmpty(row['Retail Price*']) || isNaN(parseFloat(row['Retail Price*'])) || parseFloat(row['Retail Price*']) <= 0) {
              rowErrors.retail_price = 'Retail Price must be a valid number greater than 0'
            }

            if (isEmpty(row['Category*']) || String(row['Category*']).trim() === '') {
              rowErrors.category_id = 'Category is required'
            } else {
              const category = categories.find(cat => 
                cat.name.toLowerCase() === String(row['Category*']).toLowerCase().trim()
              )
              if (!category) {
                rowErrors.category_id = `Category "${row['Category*']}" not found`
              } else {
                row['category_id'] = category.id
              }
            }

            if (row['Stock Quantity*'] === '' || isNaN(parseInt(row['Stock Quantity*'])) || parseInt(row['Stock Quantity*']) < 0) {
              rowErrors.stock_quantity = 'Stock Quantity must be a valid number (0 or greater)'
            }

            if (row['Reorder Level*'] === '' || isNaN(parseInt(row['Reorder Level*'])) || parseInt(row['Reorder Level*']) < 0) {
              rowErrors.reorder_level = 'Reorder Level must be a valid number (0 or greater)'
            }

            if (isEmpty(row['Image URLs (add each URL after a new line)']) || String(row['Image URLs (add each URL after a new line)']).trim() === '') {
              rowErrors.image_urls = 'Image URLs is required'
            }

            // Optional numeric validation
            if (!isEmpty(row['Promotion Price']) && (isNaN(parseFloat(row['Promotion Price'])) || parseFloat(row['Promotion Price']) <= 0)) {
              rowErrors.promotion_price = 'Promotion Price must be a valid number greater than 0'
            }

            if (!isEmpty(row['Gross Margin %']) && (isNaN(parseFloat(row['Gross Margin %'])) || parseFloat(row['Gross Margin %']) < 0)) {
              rowErrors.gross_margin = 'Gross Margin must be a valid number (0 or greater)'
            }

            if (!isEmpty(row['Staff Discount %']) && (isNaN(parseFloat(row['Staff Discount %'])) || parseFloat(row['Staff Discount %']) < 0 || parseFloat(row['Staff Discount %']) > 100)) {
              rowErrors.staff_discount = 'Staff Discount must be between 0 and 100'
            }

            if (!isEmpty(row['Tax Rate %']) && (isNaN(parseFloat(row['Tax Rate %'])) || parseFloat(row['Tax Rate %']) < 0 || parseFloat(row['Tax Rate %']) > 100)) {
              rowErrors.tax_rate = 'Tax Rate must be between 0 and 100'
            }

            if (!isEmpty(row['Weight/Volume']) && (isNaN(parseFloat(row['Weight/Volume'])) || parseFloat(row['Weight/Volume']) < 0)) {
              rowErrors.weight_volume = 'Weight/Volume must be a valid number (0 or greater)'
            }

            if (!isEmpty(row['Minimum Age']) && (isNaN(parseInt(row['Minimum Age'])) || parseInt(row['Minimum Age']) < 0)) {
              rowErrors.minimum_age = 'Minimum Age must be a valid number (0 or greater)'
            }

            // Date validation
            if (!isEmpty(row['Promotion Start']) && !isEmpty(row['Promotion End'])) {
              const startDate = new Date(row['Promotion Start'])
              const endDate = new Date(row['Promotion End'])
              if (startDate > endDate) {
                rowErrors.promotion_dates = 'Promotion End must be after Promotion Start'
              }
            }

            // Status validation
            if (!isEmpty(row['Status']) && !['active', 'inactive'].includes(String(row['Status']).toLowerCase())) {
              rowErrors.status = 'Status must be active or inactive'
            }

            if (Object.keys(rowErrors).length > 0) {
              errors.push({ row: rowNum, errors: rowErrors })
            } else {
              const imageUrls = row['Image URLs (add each URL after a new line)']
                .split(/\r\n|\n/)
                .map(url => url.trim().replace(/,$/, ''))
                .filter(url => url.length > 0)
                .filter((url, index, self) => index === self.indexOf(url)) // Remove duplicates

              const hasId = row['ID']?.trim() || null

              // Helper function to convert Excel date to string
              const formatDate = (value) => {
                if (!value) return ''
                // If it's already a string, return it
                if (typeof value === 'string') return value
                // If it's a number (Excel serial date), convert it
                if (typeof value === 'number') {
                  const date = new Date(Math.round((value - 25569) * 86400 * 1000))
                  return date.toISOString().split('T')[0]
                }
                return ''
              }

              validProducts.push({
                id: hasId,
                sku: row['SKU*']?.trim(),
                item_name: row['Item Name*']?.trim(),
                short_description: row['Short Description'] || '',
                long_description: row['Long Description'] || '',
                cost_price: parseFloat(row['Cost Price*']),
                retail_price: parseFloat(row['Retail Price*']),
                promotion_price: !isEmpty(row['Promotion Price']) ? parseFloat(row['Promotion Price']) : null,
                promotion_start: formatDate(row['Promotion Start']),
                promotion_end: formatDate(row['Promotion End']),
                gross_margin: !isEmpty(row['Gross Margin %']) ? parseFloat(row['Gross Margin %']) : 0,
                staff_discount: !isEmpty(row['Staff Discount %']) ? parseFloat(row['Staff Discount %']) : 0,
                tax_rate: !isEmpty(row['Tax Rate %']) ? parseFloat(row['Tax Rate %']) : 0,
                stock_quantity: parseInt(row['Stock Quantity*']) || 0,
                reorder_level: parseInt(row['Reorder Level*']) || 0,
                shelf_location: String(row['Shelf Location'] || ''),
                weight_volume: !isEmpty(row['Weight/Volume']) ? parseFloat(row['Weight/Volume']) : 0,
                unit_of_measure: String(row['Unit of Measure'] || ''),
                expiry_date: formatDate(row['Expiry Date']),
                supplier: String(row['Supplier'] || ''),
                country_of_origin: String(row['Country of Origin'] || ''),
                brand: String(row['Brand'] || ''),
                pack_size: String(row['Pack Size'] || ''),
                is_gluten_free: row['Gluten Free']?.toString().toLowerCase() === 'yes' || row['Gluten Free'] === true,
                is_vegetarian: row['Vegetarian']?.toString().toLowerCase() === 'yes' || row['Vegetarian'] === true,
                is_vegan: row['Vegan']?.toString().toLowerCase() === 'yes' || row['Vegan'] === true,
                is_age_restricted: row['Age Restricted']?.toString().toLowerCase() === 'yes' || row['Age Restricted'] === true,
                minimum_age: !isEmpty(row['Minimum Age']) ? parseInt(row['Minimum Age']) : null,
                allergen_info: String(row['Allergen Info'] || ''),
                storage_type: String(row['Storage Type'] || ''),
                is_own_brand: row['Own Brand']?.toString().toLowerCase() === 'yes' || row['Own Brand'] === true,
                online_visible: row['Online Visible']?.toString().toLowerCase() === 'yes' || row['Online Visible'] === true,
                status: row['Status'] || 'active',
                barcode: String(row['Barcode'] || ''),
                batch_number: String(row['Batch Number'] || ''),
                category_id: row['category_id'],
                subcategory_id: row['Subcategory']
                  ? (subcategories.find(sub =>
                      sub.name.toLowerCase() === String(row['Subcategory']).toLowerCase().trim()
                    )?.id || null)
                  : null,
                image_urls: imageUrls,
                images_provided: true,
                franchise_ids: row['Franchise']
                  ? String(row['Franchise']).split(',').map(f => f.trim()).filter(Boolean)
                  : [],
                notes: row['Notes'] || '',
                delete: row['Delete?']?.toString().toLowerCase() === 'yes' || false,
              })
            }
          }

          if (errors.length > 0) {
            const errorMessages = errors.map(e => 
              `Row ${e.row}: ${Object.values(e.errors).join(', ')}`
            ).join('\n')
            toast.error(`Validation Errors:\n${errorMessages}\n\nPlease fix these errors and try again.`)
            onImportComplete?.({ loading: false })
            return
          }

          if (validProducts.length === 0) {
            toast.error('No valid products to import')
            onImportComplete?.({ loading: false })
            return
          }

          onImportComplete?.({
            status: 'processing',
            batchProgress: {
              isOpen: true,
              jobId: null,
              status: 'pending',
              progress: 0,
              processed: 0,
              total: validProducts.length,
              created: 0,
              updated: 0,
              deleted: 0,
              failed: 0,
              errors: []
            }
          })

          const response = await api.post('/admin/products/batch', { products: validProducts })
          
          if (response.data.job_id) {
            onImportComplete?.({
              status: 'processing',
              batchProgress: {
                isOpen: true,
                jobId: response.data.job_id,
                status: 'processing',
                progress: 0,
                processed: 0,
                total: validProducts.length,
                created: 0,
                updated: 0,
                deleted: 0,
                failed: 0,
                errors: []
              }
            })
            
            pollingIntervalRef.current = setInterval(() => {
              pollJobStatus(response.data.job_id)
            }, 2000)
          } else {
            toast.success(`Successfully imported ${response.data.imported || validProducts.length} products`)
            if (response.data.errors && response.data.errors.length > 0) {
              toast.warning(`${response.data.errors.length} products failed to import`)
            }
            onImportComplete?.({ status: 'completed', shouldRefresh: true })
            onImportComplete?.({ status: 'close-modal' })
          }
        } catch (error) {
          toast.error(error.response?.data?.error || error.message || 'Failed to process Excel file')
          onImportComplete?.({ status: 'close-modal' })
        } finally {
          onImportComplete?.({ loading: false })
          e.target.value = ''
        }
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      toast.error('Failed to read Excel file')
      onImportComplete?.({ loading: false })
      e.target.value = ''
    }
  }

  return (
    <>
      <button onClick={downloadExcel} className="btn-secondary" title="Download Products as Excel">
        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
        Download
      </button>
      <button onClick={() => excelInputRef.current?.click()} className="btn-secondary" title="Upload Products from Excel">
        <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
        Upload
      </button>
      <input
        type="file"
        ref={excelInputRef}
        accept=".xlsx,.xls"
        onChange={uploadExcel}
        className="hidden"
      />
    </>
  )
}
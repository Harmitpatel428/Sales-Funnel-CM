# CM (Mandate Management) Module

## Overview
The CM module provides comprehensive mandate management functionality for the Lead Management System. It allows users to create, manage, and track mandates both from existing leads and as standalone entities.

## Features

### 1. Create Mandate from Existing Lead
- **Lead Search**: Search through existing leads by client name, company, consumer number, or KVA
- **Auto-fill Form**: When a lead is selected, the mandate form is automatically populated with lead information
- **Editable Fields**: Users can modify any pre-filled information before saving
- **Lead Linking**: Mandates created from leads maintain a reference to the original lead

### 2. Create New Mandate
- **Standalone Creation**: Create mandates without linking to any existing lead
- **Manual Entry**: All fields can be filled manually
- **Complete Form**: Includes all necessary mandate information fields

### 3. Mandates List View
- **Search Functionality**: Search mandates by name, client, company, consumer number, etc.
- **Status Filtering**: Filter mandates by status (Draft, Active, Closed, All)
- **Table View**: Clean, responsive table displaying all mandate information
- **Actions**: Delete mandates with confirmation

## Data Structure

### Mandate Fields
- `mandateId`: Unique identifier (UUID)
- `leadId`: Optional reference to source lead (null for standalone mandates)
- `mandateName`: Name/title of the mandate
- `clientName`: Client's name
- `company`: Company name
- `consumerNumber`: Consumer number
- `kva`: KVA rating
- `phone`: Phone number
- `address`: Address
- `discom`: Discom (UGVCL, MGVCL, DGVCL, PGVCL)
- `gidc`: GIDC information
- `gstNumber`: GST number
- `createdAt`: Creation timestamp
- `status`: Current status (draft, active, closed)
- `notes`: Additional notes
- `isDeleted`: Soft delete flag

## Technical Implementation

### Context Management
- **MandateContext**: Manages mandate state using React Context API
- **localStorage Integration**: Follows existing patterns for data persistence
- **Debounced Updates**: Optimized localStorage writes with 300ms debounce

### UI Components
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Form Validation**: Required field validation with error handling
- **Accessibility**: Proper ARIA labels and keyboard navigation support
- **Loading States**: Smooth loading indicators during data operations

### Navigation Integration
- **CM Button**: Added to main navigation bar
- **Route**: `/cm` - Main mandate management page
- **Context Provider**: Integrated into app layout hierarchy

## Usage

1. **Access CM Module**: Click "CM" in the navigation bar
2. **Choose Creation Method**:
   - Select "Create Mandate from Existing Lead" to use lead data
   - Select "Create New Mandate" for standalone creation
3. **Fill Form**: Complete required fields and optional information
4. **Save**: Click "Create Mandate" to save
5. **View All**: Use "View All Mandates" to see all created mandates
6. **Manage**: Search, filter, and delete mandates as needed

## Integration Points

- **LeadContext**: Reads existing leads for mandate creation
- **localStorage**: Stores mandate data persistently
- **Navigation**: Seamlessly integrated with existing navigation system
- **Styling**: Consistent with existing UI design patterns

## Future Enhancements

- Edit mandate functionality
- Export mandates to CSV/Excel
- Mandate status workflow management
- Bulk operations
- Advanced filtering options
- Mandate templates
- Document attachment support

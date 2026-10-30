import { z } from 'zod';

export const createLabOrderSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    encounterId: z.string().uuid().optional().nullable(),
    facilityId: z.string().uuid().optional().nullable(),
    testDefinitionIds: z.array(z.string().min(1, 'Test identifier cannot be empty')).optional(),
    orderedBy: z.string().optional().nullable(),
    priority: z.enum(['routine', 'urgent', 'stat']).optional().default('routine'),
    clinicalInfo: z.string().optional().nullable(),
    processingSource: z.enum(['in_house', 'outsource_send', 'outsource_return', 'external_upload']).optional().default('in_house'),
    outsourceLabId: z.string().uuid().optional().nullable(),
    specimenType: z.string().optional().nullable(),
    collectedBy: z.string().optional().nullable(),
    fasting: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    items: z.array(z.object({
      testDefinitionId: z.string().min(1, 'Test identifier cannot be empty'),
      specimenType: z.string().optional().nullable(),
      container: z.string().optional().nullable(),
      processingSource: z.enum(['in_house', 'outsource_send', 'outsource_return', 'external_upload']).optional().default('in_house'),
      outsourceLabId: z.string().uuid().optional().nullable(),
      barcode: z.string().optional().nullable(),
      collectedBy: z.string().optional().nullable(),
      collectionTime: z.string().optional().nullable(),
      fasting: z.string().optional().nullable(),
      price: z.number().optional().nullable(),
      collectAtHospital: z.boolean().optional().default(true),
      outsourceCost: z.number().optional().nullable(),
      outsourceRefNo: z.string().optional().nullable(),
    })).optional(),
    paymentStatus: z.string().optional().nullable(),
    paymentMode: z.string().optional().nullable()
  }).refine(
    (data) => (Array.isArray(data.items) && data.items.length > 0) || (Array.isArray(data.testDefinitionIds) && data.testDefinitionIds.length > 0),
    { message: 'At least one test definition must be selected' }
  )
});

export const updateLabResultSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    result: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['ordered', 'scheduled', 'in_progress', 'completed', 'cancelled']).optional()
  })
});

export const submitBulkResultsSchema = z.object({
  params: z.object({
    id: z.string().uuid() // order_item_id
  }),
  body: z.object({
    results: z.array(z.object({
      parameterId: z.string().uuid().optional().nullable(),
      parameterName: z.string().optional(),
      valueNumeric: z.number().optional().nullable(),
      valueText: z.string().optional().nullable(),
      unit: z.string().optional().nullable(),
      referenceLow: z.number().optional().nullable(),
      referenceHigh: z.number().optional().nullable(),
      flag: z.enum(['normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal', 'positive', 'negative']).optional().nullable(),
      comments: z.string().optional().nullable()
    })),
    status: z.enum(['preliminary', 'final']).optional().default('preliminary')
  })
});

export const verifyResultSchema = z.object({
  params: z.object({
    id: z.string().uuid() // order_item_id
  }),
  body: z.object({
    verifiedBy: z.string().optional().nullable(),
    comments: z.string().optional().nullable()
  }).optional()
});

export const updateSpecimenStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    status: z.enum(['pending_collection', 'collected', 'received', 'in_process', 'rejected', 'stored', 'discarded']),
    rejectionReason: z.string().optional().nullable()
  })
});

export const outsourceSpecimenSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    outsourceLabId: z.string().uuid(),
    outsourceRefNo: z.string().optional().nullable(),
    expectedReturnAt: z.string().optional().nullable(),
    outsourceCost: z.number().optional().nullable()
  })
});

export const outsourceReturnSpecimenSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    returnedAt: z.string().optional().nullable(),
    notes: z.string().optional().nullable()
  })
});

export const outsourceLabSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Lab name is required'),
    code: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    contractRate: z.number().min(0).max(100).optional().default(0),
    turnaroundDays: z.number().int().min(1).optional().default(2),
    isActive: z.boolean().optional().default(true)
  })
});

export const updateOutsourceLabSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    contractRate: z.number().min(0).max(100).optional(),
    turnaroundDays: z.number().int().min(1).optional(),
    isActive: z.boolean().optional()
  })
});

export const createTestDefinitionSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Test name is required'),
    code: z.string().min(1, 'Test code is required'),
    description: z.string().optional().nullable(),
    labSection: z.string().optional().default('Biochemistry'),
    specimenType: z.string().optional().default('Serum'),
    price: z.number().min(0, 'Price must be non-negative').optional().default(350),
    tatHours: z.number().int().min(1).optional().default(4),
    fastingRequired: z.boolean().optional().default(false),
    parameters: z.array(z.object({
      name: z.string().min(1, 'Parameter name is required'),
      code: z.string().optional(),
      unit: z.string().optional().nullable(),
      dataType: z.enum(['numeric', 'text', 'coded']).optional().default('numeric'),
      referenceRange: z.string().optional().nullable()
    })).optional()
  })
});

export const updateTestDefinitionSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    labSection: z.string().optional(),
    specimenType: z.string().optional(),
    price: z.number().min(0).optional(),
    tatHours: z.number().int().min(1).optional(),
    fastingRequired: z.boolean().optional()
  })
});

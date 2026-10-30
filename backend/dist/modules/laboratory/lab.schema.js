"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTestDefinitionSchema = exports.createTestDefinitionSchema = exports.updateOutsourceLabSchema = exports.outsourceLabSchema = exports.outsourceReturnSpecimenSchema = exports.outsourceSpecimenSchema = exports.updateSpecimenStatusSchema = exports.verifyResultSchema = exports.submitBulkResultsSchema = exports.updateLabResultSchema = exports.createLabOrderSchema = void 0;
const zod_1 = require("zod");
exports.createLabOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string().uuid(),
        encounterId: zod_1.z.string().uuid().optional().nullable(),
        facilityId: zod_1.z.string().uuid().optional().nullable(),
        testDefinitionIds: zod_1.z.array(zod_1.z.string().min(1, 'Test identifier cannot be empty')).optional(),
        orderedBy: zod_1.z.string().optional().nullable(),
        priority: zod_1.z.enum(['routine', 'urgent', 'stat']).optional().default('routine'),
        clinicalInfo: zod_1.z.string().optional().nullable(),
        processingSource: zod_1.z.enum(['in_house', 'outsource_send', 'outsource_return', 'external_upload']).optional().default('in_house'),
        outsourceLabId: zod_1.z.string().uuid().optional().nullable(),
        specimenType: zod_1.z.string().optional().nullable(),
        collectedBy: zod_1.z.string().optional().nullable(),
        fasting: zod_1.z.string().optional().nullable(),
        barcode: zod_1.z.string().optional().nullable(),
        items: zod_1.z.array(zod_1.z.object({
            testDefinitionId: zod_1.z.string().min(1, 'Test identifier cannot be empty'),
            specimenType: zod_1.z.string().optional().nullable(),
            container: zod_1.z.string().optional().nullable(),
            processingSource: zod_1.z.enum(['in_house', 'outsource_send', 'outsource_return', 'external_upload']).optional().default('in_house'),
            outsourceLabId: zod_1.z.string().uuid().optional().nullable(),
            barcode: zod_1.z.string().optional().nullable(),
            collectedBy: zod_1.z.string().optional().nullable(),
            collectionTime: zod_1.z.string().optional().nullable(),
            fasting: zod_1.z.string().optional().nullable(),
            price: zod_1.z.number().optional().nullable(),
            collectAtHospital: zod_1.z.boolean().optional().default(true),
            outsourceCost: zod_1.z.number().optional().nullable(),
            outsourceRefNo: zod_1.z.string().optional().nullable(),
        })).optional(),
        paymentStatus: zod_1.z.string().optional().nullable(),
        paymentMode: zod_1.z.string().optional().nullable()
    }).refine((data) => (Array.isArray(data.items) && data.items.length > 0) || (Array.isArray(data.testDefinitionIds) && data.testDefinitionIds.length > 0), { message: 'At least one test definition must be selected' })
});
exports.updateLabResultSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        result: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        status: zod_1.z.enum(['ordered', 'scheduled', 'in_progress', 'completed', 'cancelled']).optional()
    })
});
exports.submitBulkResultsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid() // order_item_id
    }),
    body: zod_1.z.object({
        results: zod_1.z.array(zod_1.z.object({
            parameterId: zod_1.z.string().uuid().optional().nullable(),
            parameterName: zod_1.z.string().optional(),
            valueNumeric: zod_1.z.number().optional().nullable(),
            valueText: zod_1.z.string().optional().nullable(),
            unit: zod_1.z.string().optional().nullable(),
            referenceLow: zod_1.z.number().optional().nullable(),
            referenceHigh: zod_1.z.number().optional().nullable(),
            flag: zod_1.z.enum(['normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal', 'positive', 'negative']).optional().nullable(),
            comments: zod_1.z.string().optional().nullable()
        })),
        status: zod_1.z.enum(['preliminary', 'final']).optional().default('preliminary')
    })
});
exports.verifyResultSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid() // order_item_id
    }),
    body: zod_1.z.object({
        verifiedBy: zod_1.z.string().optional().nullable(),
        comments: zod_1.z.string().optional().nullable()
    }).optional()
});
exports.updateSpecimenStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(['pending_collection', 'collected', 'received', 'in_process', 'rejected', 'stored', 'discarded']),
        rejectionReason: zod_1.z.string().optional().nullable()
    })
});
exports.outsourceSpecimenSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        outsourceLabId: zod_1.z.string().uuid(),
        outsourceRefNo: zod_1.z.string().optional().nullable(),
        expectedReturnAt: zod_1.z.string().optional().nullable(),
        outsourceCost: zod_1.z.number().optional().nullable()
    })
});
exports.outsourceReturnSpecimenSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        returnedAt: zod_1.z.string().optional().nullable(),
        notes: zod_1.z.string().optional().nullable()
    })
});
exports.outsourceLabSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Lab name is required'),
        code: zod_1.z.string().optional().nullable(),
        contactPerson: zod_1.z.string().optional().nullable(),
        phone: zod_1.z.string().optional().nullable(),
        email: zod_1.z.string().email().optional().nullable(),
        address: zod_1.z.string().optional().nullable(),
        contractRate: zod_1.z.number().min(0).max(100).optional().default(0),
        turnaroundDays: zod_1.z.number().int().min(1).optional().default(2),
        isActive: zod_1.z.boolean().optional().default(true)
    })
});
exports.updateOutsourceLabSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        code: zod_1.z.string().optional().nullable(),
        contactPerson: zod_1.z.string().optional().nullable(),
        phone: zod_1.z.string().optional().nullable(),
        email: zod_1.z.string().email().optional().nullable(),
        address: zod_1.z.string().optional().nullable(),
        contractRate: zod_1.z.number().min(0).max(100).optional(),
        turnaroundDays: zod_1.z.number().int().min(1).optional(),
        isActive: zod_1.z.boolean().optional()
    })
});
exports.createTestDefinitionSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Test name is required'),
        code: zod_1.z.string().min(1, 'Test code is required'),
        description: zod_1.z.string().optional().nullable(),
        labSection: zod_1.z.string().optional().default('Biochemistry'),
        specimenType: zod_1.z.string().optional().default('Serum'),
        price: zod_1.z.number().min(0, 'Price must be non-negative').optional().default(350),
        tatHours: zod_1.z.number().int().min(1).optional().default(4),
        fastingRequired: zod_1.z.boolean().optional().default(false),
        parameters: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string().min(1, 'Parameter name is required'),
            code: zod_1.z.string().optional(),
            unit: zod_1.z.string().optional().nullable(),
            dataType: zod_1.z.enum(['numeric', 'text', 'coded']).optional().default('numeric'),
            referenceRange: zod_1.z.string().optional().nullable()
        })).optional()
    })
});
exports.updateTestDefinitionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        code: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().optional().nullable(),
        labSection: zod_1.z.string().optional(),
        specimenType: zod_1.z.string().optional(),
        price: zod_1.z.number().min(0).optional(),
        tatHours: zod_1.z.number().int().min(1).optional(),
        fastingRequired: zod_1.z.boolean().optional()
    })
});

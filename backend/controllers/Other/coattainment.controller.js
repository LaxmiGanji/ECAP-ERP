const Coattainment = require('../../models/Other/coattainment.model');
const coattainmentService = require('../../services/coattainment.service');

exports.calculateCoattainment = async (req, res) => {
    try {
        const data = req.body;
        console.log('[/api/coattainment/calculate-coattainment] Request received');
        console.log('[/api/coattainment/calculate-coattainment] Has marksData:', !!data.marksData);
        console.log('[/api/coattainment/calculate-coattainment] Marks data rows:', data.marksData?.length || 0);

        // Basic validation for creation/template flow
        if (!data.assessmentId) {
            // Require subjectId, branchId and semester.
            // coNumber can be provided at top-level OR per-question via data.questions[].coNumber
            if (!data.subjectId || !data.branchId || !data.semester) {
                return res.status(400).json({ success: false, message: 'subjectId, branchId and semester are required when creating assessment/template' });
            }

            // If no top-level coNumber, ensure questions include at least one coNumber mapping
            const hasTopLevelCO = !!data.coNumber;
            const hasPerQuestionCO = Array.isArray(data.questions) && data.questions.some(q => q.coNumber);
            if (!hasTopLevelCO && !hasPerQuestionCO) {
                return res.status(400).json({ success: false, message: 'Provide a top-level coNumber or map COs to questions in the questions array' });
            }

            if ((!data.questions || data.questions.length === 0) && (!data.assignments || data.assignments.length === 0)) {
                return res.status(400).json({ success: false, message: 'Provide questions or assignments to create an assessment/template' });
            }
        }

        console.log('[/api/coattainment/calculate-coattainment] Validation passed, calling service...');
        const result = await coattainmentService.calculate(data);
        console.log('[/api/coattainment/calculate-coattainment] Service returned successfully');
        return res.status(200).json(result);
    } catch (error) {
        console.error('coattainment calculate error:', error.message);
        console.error('Stack trace:', error.stack);
        const msg = error && error.message ? error.message : 'Internal Server Error';
        return res.status(500).json({ success: false, message: msg });
    }
};

exports.getAttainments = async (req, res) => {
    try {
        const { subjectId } = req.params;
        
        if (!subjectId) {
            return res.status(400).json({ success: false, message: 'Subject ID is required' });
        }

        const result = await coattainmentService.getCOAttainments(subjectId);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching attainments:', error);
        return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};